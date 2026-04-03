import { Injectable, Logger } from "@nestjs/common";
import type { MeetingType, RoleType } from "@repo/shared";
import {
	ADMIN_BOOKING_ROLES,
	AppError,
	BOOKING_ATTACHMENTS_BUCKET,
	BOOKING_UPLOAD_FOLDER,
	BUSINESS_HOUR_END_MINUTES,
	BUSINESS_HOUR_START_MINUTES,
	type CreateRoomBookingInput,
	FILE_COUNT_LIMITS,
	type GenerateBookingUploadUrlInput,
	type GenerateBookingUploadUrlResponse,
	type GetRoomBookingByIdInput,
	type GetRoomBookingListInput,
	MIME_EXTENSIONS,
	MIN_DURATION_MINUTES,
	PH_TIME_ZONE,
	type RoomBookingListResponse,
	type RoomBookingResponse,
	type UpdateRoomBookingInput,
	type UpdateRoomBookingStatusInput,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";

const HAS_TIMEZONE_SUFFIX = /([zZ]|[+-]\d{2}:\d{2})$/;

const PHT_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeZone: PH_TIME_ZONE,
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

function normalizeBookingAttachmentPath(path: string): string {
	const trimmed = path.trim().replace(/^\/+/, "");
	const bucketPrefix = `${BOOKING_ATTACHMENTS_BUCKET}/`;
	return trimmed.startsWith(bucketPrefix)
		? trimmed.slice(bucketPrefix.length)
		: trimmed;
}

/**
 * Maps a Prisma RoomBooking record (with optional user relation) to the
 * RoomBookingResponse shape required by clients.
 */
function toResponse(
	record: {
		id: string;
		bookedBy: string;
		title: string;
		meetingType: string;
		meetingTypeOthers: string | null;
		startTime: Date;
		endTime: Date;
		requestedFor: string;
		room: string;
		attachments: Array<{ path: string }>;
		status: string;
		createdAt: Date;
		user?: { id: string; fullName: string } | null;
	},
	signedUrlByPath: Map<string, string | null> = new Map(),
): RoomBookingResponse {
	return {
		id: record.id,
		bookedBy: record.bookedBy,
		title: record.title,
		meetingType: record.meetingType as RoomBookingResponse["meetingType"],
		meetingTypeOthers: record.meetingTypeOthers,
		startTime: record.startTime.toISOString(),
		endTime: record.endTime.toISOString(),
		requestedFor: record.requestedFor,
		room: record.room as RoomBookingResponse["room"],
		attachments: record.attachments.map((attachment) => {
			const normalizedPath = normalizeBookingAttachmentPath(attachment.path);
			return {
				path: normalizedPath,
				url: signedUrlByPath.get(normalizedPath) ?? null,
			};
		}),
		status: record.status as RoomBookingResponse["status"],
		createdAt: record.createdAt.toISOString(),
		user: record.user ?? null,
	};
}

/** Include clause reused across queries. */
const BOOKING_INCLUDE = {
	user: { select: { id: true, fullName: true } },
	attachments: { select: { path: true } },
} as const;

@Injectable()
export class RoomBookingService {
	private readonly logger = new Logger(RoomBookingService.name);

	constructor(
		private readonly db: DbService,
		private readonly storage: SupabaseStorageService,
	) {}

	private normalizeAttachmentPath(path: string): string {
		return normalizeBookingAttachmentPath(path);
	}

	private normalizeAttachmentPaths(paths: string[]): string[] {
		return [
			...new Set(paths.map((path) => this.normalizeAttachmentPath(path))),
		];
	}

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------

	private parseBookingDateTime(value: string): Date {
		const normalizedValue = HAS_TIMEZONE_SUFFIX.test(value)
			? value
			: `${value}+08:00`;
		const parsed = new Date(normalizedValue);

		if (Number.isNaN(parsed.getTime())) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		return parsed;
	}

	private getPhtMinutes(date: Date): number {
		const parts = PHT_TIME_FORMATTER.formatToParts(date);
		const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
		const minute = Number(
			parts.find((part) => part.type === "minute")?.value ?? 0,
		);

		return hour * 60 + minute;
	}

	private validateTimeRange(startTime: Date, endTime: Date): void {
		const now = new Date();
		if (startTime < now) {
			throw new AppError("ROOM_BOOKING.PAST_BOOKING");
		}

		if (endTime <= startTime) {
			throw new AppError("ROOM_BOOKING.INVALID_TIME_RANGE");
		}

		const durationMs = endTime.getTime() - startTime.getTime();
		const durationMinutes = durationMs / (1000 * 60);

		if (durationMinutes < MIN_DURATION_MINUTES) {
			throw new AppError("ROOM_BOOKING.INVALID_TIME_RANGE");
		}

		const startMinutes = this.getPhtMinutes(startTime);
		const endMinutes = this.getPhtMinutes(endTime);

		if (
			startMinutes < BUSINESS_HOUR_START_MINUTES ||
			startMinutes > BUSINESS_HOUR_END_MINUTES ||
			endMinutes < BUSINESS_HOUR_START_MINUTES ||
			endMinutes > BUSINESS_HOUR_END_MINUTES
		) {
			throw new AppError("ROOM_BOOKING.INVALID_TIME_RANGE");
		}
	}

	private normalizeMeetingTypeOthers(
		meetingType: MeetingType,
		meetingTypeOthers?: string,
	): string | null {
		if (meetingType !== "others") {
			return null;
		}

		const normalized = meetingTypeOthers?.trim();
		if (!normalized) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		return normalized;
	}

	private async getSignedUrlMap(
		paths: string[],
	): Promise<Map<string, string | null>> {
		if (paths.length === 0) {
			return new Map();
		}

		const normalizedPaths = this.normalizeAttachmentPaths(paths);

		const signedAttachments = await this.storage.getSignedUrls(
			BOOKING_ATTACHMENTS_BUCKET,
			normalizedPaths,
		);

		return new Map(
			signedAttachments.map((attachment) => [
				attachment.path,
				attachment.signedUrl,
			]),
		);
	}

	private isAdminRole(role: RoleType): boolean {
		return (ADMIN_BOOKING_ROLES as readonly string[]).includes(role);
	}

	private async checkAvailability(
		startTime: Date,
		endTime: Date,
		room: string,
		excludeBookingId?: string,
	): Promise<boolean> {
		const conflicting = await this.db.roomBooking.findFirst({
			where: {
				room: room as never,
				OR: [{ status: "confirmed" }, { status: "pending" }],
				...(excludeBookingId && {
					id: { not: excludeBookingId },
				}),
				AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
			},
			select: { id: true },
		});

		const available = conflicting === null;

		if (!available) {
			this.logger.debug(
				`Conflict detected for room ${room} between ${startTime.toISOString()} – ${endTime.toISOString()}`,
			);
		}

		return available;
	}

	// ---------------------------------------------------------------------------
	// GET /bookings
	// ---------------------------------------------------------------------------

	async getList(
		input: GetRoomBookingListInput,
		userRole: RoleType,
	): Promise<RoomBookingListResponse> {
		const { status, room, date, startDate, endDate, bookedBy, limit, page } =
			input;
		const skip = (page - 1) * limit;

		if (status === "pending" && !this.isAdminRole(userRole)) {
			throw new AppError("ROOM_BOOKING.FORBIDDEN");
		}

		// Build date range filter when a specific day is requested.
		// Use +08:00 (Philippine Standard Time) so the boundaries align with
		// local midnight, not UTC midnight — prevents off-by-one on dates
		// when bookings in the morning are stored as the previous UTC day.
		let dateFilter: { gte: Date; lt: Date } | undefined;
		if (date) {
			const startOfDay = new Date(`${date}T00:00:00.000+08:00`);
			const endOfDay = new Date(`${date}T23:59:59.999+08:00`);
			dateFilter = { gte: startOfDay, lt: endOfDay };
		} else if (startDate && endDate) {
			// Multi-day range: startDate is inclusive, endDate is exclusive
			dateFilter = {
				gte: new Date(`${startDate}T00:00:00.000+08:00`),
				lt: new Date(`${endDate}T00:00:00.000+08:00`),
			};
		}

		const where = {
			...(status && { status: status as never }),
			...(room && { room: room as never }),
			...(dateFilter && { startTime: dateFilter }),
			...(bookedBy && { bookedBy }),
		};

		const [totalItems, bookings] = await Promise.all([
			this.db.roomBooking.count({ where }),
			this.db.roomBooking.findMany({
				where,
				include: BOOKING_INCLUDE,
				orderBy: { startTime: "asc" },
				take: limit,
				skip,
			}),
		]);

		const totalPages = Math.ceil(totalItems / limit) || 1;

		const attachmentPaths = bookings.flatMap((booking) =>
			booking.attachments.map((attachment) => attachment.path),
		);
		const signedUrlByPath = await this.getSignedUrlMap(attachmentPaths);
		const signedBookings = bookings.map((booking) =>
			toResponse(booking, signedUrlByPath),
		);

		return {
			bookings: signedBookings,
			pagination: {
				currentPage: page,
				totalPages,
				totalItems,
				itemsPerPage: limit,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		};
	}

	// ---------------------------------------------------------------------------
	// GET /admin/bookings/{id}
	// ---------------------------------------------------------------------------

	async getById(input: GetRoomBookingByIdInput): Promise<RoomBookingResponse> {
		const booking = await this.db.roomBooking.findUnique({
			where: { id: input.id },
			include: BOOKING_INCLUDE,
		});

		if (!booking) {
			throw new AppError("ROOM_BOOKING.NOT_FOUND");
		}

		const attachmentPaths = booking.attachments.map(
			(attachment) => attachment.path,
		);
		const signedUrlByPath = await this.getSignedUrlMap(attachmentPaths);

		return toResponse(booking, signedUrlByPath);
	}

	// ---------------------------------------------------------------------------
	// POST /bookings
	// ---------------------------------------------------------------------------

	async create(
		input: CreateRoomBookingInput,
		userId: string,
		userRole: RoleType,
	): Promise<RoomBookingResponse> {
		const startTime = this.parseBookingDateTime(input.startTime);
		const endTime = this.parseBookingDateTime(input.endTime);
		const meetingTypeOthers = this.normalizeMeetingTypeOthers(
			input.meetingType as MeetingType,
			input.meetingTypeOthers,
		);
		const attachmentPaths = this.normalizeAttachmentPaths(
			input.attachmentPaths ?? [],
		);

		if (attachmentPaths.length > FILE_COUNT_LIMITS.SM) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		// Scenario 3 — Validate time range
		this.validateTimeRange(startTime, endTime);

		// Edge Case: Conflict check against CONFIRMED and PENDING bookings
		const available = await this.checkAvailability(
			startTime,
			endTime,
			input.room,
		);

		if (!available) {
			throw new AppError("ROOM_BOOKING.CONFLICT");
		}

		// Scenario 1 & 2 — Determine initial status from role
		const status = userRole === "councilor" ? "pending" : "confirmed";

		const booking = await this.db.roomBooking.create({
			data: {
				bookedBy: userId,
				title: input.title,
				meetingType: input.meetingType as never,
				meetingTypeOthers,
				startTime,
				endTime,
				requestedFor: input.requestedFor,
				room: input.room as never, // Prisma enum cast
				...(attachmentPaths.length > 0 && {
					attachments: {
						createMany: {
							data: attachmentPaths.map((path) => ({ path })),
						},
					},
				}),
				status,
			},
			include: BOOKING_INCLUDE,
		});

		this.logger.log(
			`Booking created: ${booking.id} by user ${userId} with status "${status}"`,
		);

		const signedUrlByPath = await this.getSignedUrlMap(attachmentPaths);

		return toResponse(booking, signedUrlByPath);
	}

	// ---------------------------------------------------------------------------
	// PATCH /bookings/{id}/status
	// ---------------------------------------------------------------------------

	async updateStatus(
		input: UpdateRoomBookingStatusInput,
		userRole: RoleType,
	): Promise<RoomBookingResponse> {
		// Scenario 1 — RBAC: only admin-level roles may approve/reject
		if (!this.isAdminRole(userRole)) {
			throw new AppError("ROOM_BOOKING.FORBIDDEN");
		}

		const booking = await this.db.roomBooking.findUnique({
			where: { id: input.id },
			include: BOOKING_INCLUDE,
		});

		if (!booking) {
			throw new AppError("ROOM_BOOKING.NOT_FOUND");
		}

		// Only PENDING bookings can be approved or rejected
		if (booking.status !== "pending") {
			throw new AppError("ROOM_BOOKING.CANNOT_APPROVE");
		}

		// Scenario 2 — Re-run conflict check before confirming
		if (input.status === "confirmed") {
			const available = await this.checkAvailability(
				booking.startTime,
				booking.endTime,
				booking.room,
				booking.id, // exclude the booking itself
			);

			if (!available) {
				throw new AppError("ROOM_BOOKING.CONFLICT");
			}
		}

		const updated = await this.db.roomBooking.update({
			where: { id: input.id },
			data: { status: input.status },
			include: BOOKING_INCLUDE,
		});

		this.logger.log(`Booking ${input.id} status updated to "${input.status}"`);

		const signedUrlByPath = await this.getSignedUrlMap(
			updated.attachments.map((attachment) => attachment.path),
		);

		return toResponse(updated, signedUrlByPath);
	}

	// ---------------------------------------------------------------------------
	// PUT /bookings/{id}
	// ---------------------------------------------------------------------------

	async update(
		input: UpdateRoomBookingInput,
		userId: string,
		userRole: RoleType,
	): Promise<RoomBookingResponse> {
		const booking = await this.db.roomBooking.findUnique({
			where: { id: input.id },
			include: BOOKING_INCLUDE,
		});

		if (!booking) {
			throw new AppError("ROOM_BOOKING.NOT_FOUND");
		}

		// Scenario 1 — Ownership check (admins bypass)
		if (booking.bookedBy !== userId && !this.isAdminRole(userRole)) {
			throw new AppError("ROOM_BOOKING.FORBIDDEN");
		}

		const newStartTime = input.startTime
			? this.parseBookingDateTime(input.startTime)
			: booking.startTime;
		const newEndTime = input.endTime
			? this.parseBookingDateTime(input.endTime)
			: booking.endTime;
		const newRoom = input.room ?? booking.room;
		const timesChanged =
			input.startTime !== undefined ||
			input.endTime !== undefined ||
			input.room !== undefined;
		const shouldResetToPending =
			userRole === "councilor" &&
			timesChanged &&
			(booking.status === "confirmed" || booking.status === "rejected");

		const resolvedMeetingType =
			(input.meetingType as MeetingType | undefined) ??
			(booking.meetingType as MeetingType);
		const resolvedMeetingTypeOthers = this.normalizeMeetingTypeOthers(
			resolvedMeetingType,
			input.meetingTypeOthers !== undefined
				? (input.meetingTypeOthers ?? undefined)
				: (booking.meetingTypeOthers ?? undefined),
		);

		const currentAttachmentPaths = booking.attachments.map((attachment) =>
			this.normalizeAttachmentPath(attachment.path),
		);
		const nextAttachmentPaths =
			input.attachmentPaths !== undefined
				? this.normalizeAttachmentPaths(input.attachmentPaths)
				: currentAttachmentPaths;

		if (nextAttachmentPaths.length > FILE_COUNT_LIMITS.SM) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		if (timesChanged) {
			// Scenario 3 — Validate new time range
			this.validateTimeRange(newStartTime, newEndTime);

			// Conflict check excluding this booking's own slot
			const available = await this.checkAvailability(
				newStartTime,
				newEndTime,
				newRoom,
				booking.id,
			);

			if (!available) {
				throw new AppError("ROOM_BOOKING.CONFLICT");
			}
		}

		const updated = await this.db.roomBooking.update({
			where: { id: input.id },
			data: {
				...(input.title !== undefined && { title: input.title }),
				...(input.meetingType !== undefined && {
					meetingType: input.meetingType as never,
				}),
				...(input.meetingType !== undefined ||
				input.meetingTypeOthers !== undefined
					? { meetingTypeOthers: resolvedMeetingTypeOthers }
					: {}),
				...(input.requestedFor !== undefined && {
					requestedFor: input.requestedFor,
				}),
				...(input.room !== undefined && { room: input.room as never }),
				...(input.attachmentPaths !== undefined && {
					attachments: {
						deleteMany: {},
						...(nextAttachmentPaths.length > 0 && {
							createMany: {
								data: nextAttachmentPaths.map((path) => ({ path })),
							},
						}),
					},
				}),
				startTime: newStartTime,
				endTime: newEndTime,
				...(shouldResetToPending && { status: "pending" }),
			},
			include: BOOKING_INCLUDE,
		});

		if (shouldResetToPending) {
			this.logger.debug(
				`Booking ${booking.id} status reset to pending after schedule/room edit`,
			);
		}

		if (input.attachmentPaths !== undefined) {
			const deletedAttachmentPaths = currentAttachmentPaths.filter(
				(path) => !nextAttachmentPaths.includes(path),
			);

			if (deletedAttachmentPaths.length > 0) {
				await Promise.all(
					deletedAttachmentPaths.map((path) =>
						this.storage.deleteFile(BOOKING_ATTACHMENTS_BUCKET, path),
					),
				);
			}
		}

		const signedUrlByPath = await this.getSignedUrlMap(nextAttachmentPaths);

		return toResponse(updated, signedUrlByPath);
	}

	// ---------------------------------------------------------------------------
	// DELETE /bookings/{id}
	// ---------------------------------------------------------------------------

	async delete(
		id: string,
		userId: string,
		userRole: RoleType,
	): Promise<{ success: boolean }> {
		const booking = await this.db.roomBooking.findUnique({
			where: { id },
			select: {
				id: true,
				bookedBy: true,
				attachments: { select: { path: true } },
			},
		});

		if (!booking) {
			throw new AppError("ROOM_BOOKING.NOT_FOUND");
		}

		// Scenario 1 — Ownership check
		if (booking.bookedBy !== userId && !this.isAdminRole(userRole)) {
			throw new AppError("ROOM_BOOKING.FORBIDDEN");
		}

		await this.db.roomBooking.delete({ where: { id } });

		if (booking.attachments.length > 0) {
			await Promise.all(
				booking.attachments.map((attachment) =>
					this.storage.deleteFile(BOOKING_ATTACHMENTS_BUCKET, attachment.path),
				),
			);
		}

		this.logger.log(`Booking ${id} deleted by user ${userId}`);

		return { success: true };
	}

	// ---------------------------------------------------------------------------
	// POST /bookings/upload-url
	// ---------------------------------------------------------------------------

	async generateUploadUrl(
		input: GenerateBookingUploadUrlInput,
	): Promise<GenerateBookingUploadUrlResponse> {
		const { fileName, mimeType } = input;

		// Scenario 1 — Validate MIME type is allowed
		const allowedExtensions = MIME_EXTENSIONS[mimeType];
		if (!allowedExtensions) {
			throw new AppError("ROOM_BOOKING.INVALID_ATTACHMENT");
		}

		// Anti-rename executable check: file extension must match declared MIME type
		const ext = `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`;
		if (!allowedExtensions.includes(ext)) {
			throw new AppError("ROOM_BOOKING.INVALID_ATTACHMENT");
		}

		const uploadPath = this.storage.generateUploadPath(
			BOOKING_UPLOAD_FOLDER,
			fileName,
		);

		const result = await this.storage.createSignedUploadUrl(
			BOOKING_ATTACHMENTS_BUCKET,
			uploadPath,
		);

		return {
			uploadUrl: result.signedUrl,
			path: result.path,
		};
	}
}
