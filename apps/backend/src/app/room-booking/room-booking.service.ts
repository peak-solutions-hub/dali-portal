import { Injectable, Logger } from "@nestjs/common";
import type { RoleType } from "@repo/shared";
import {
	ADMIN_BOOKING_ROLES,
	AppError,
	BOOKING_ATTACHMENTS_BUCKET,
	BOOKING_UPLOAD_FOLDER,
	type CreateRoomBookingInput,
	type GenerateBookingUploadUrlInput,
	type GenerateBookingUploadUrlResponse,
	type GetRoomBookingByIdInput,
	type GetRoomBookingListInput,
	MIME_EXTENSIONS,
	MIN_DURATION_MINUTES,
	type RoomBookingListResponse,
	type RoomBookingResponse,
	type UpdateRoomBookingInput,
	type UpdateRoomBookingStatusInput,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";
import { RoomBookingAvailabilityService } from "./room-booking-availability.service";

/**
 * Maps a Prisma RoomBooking record (with optional user relation) to the
 * RoomBookingResponse shape required by clients.
 */
function toResponse(record: {
	id: string;
	bookedBy: string;
	title: string;
	startTime: Date;
	endTime: Date;
	requestedFor: string;
	room: string;
	attachmentUrl: string | null;
	status: string;
	createdAt: Date;
	user?: { id: string; fullName: string } | null;
}): RoomBookingResponse {
	return {
		id: record.id,
		bookedBy: record.bookedBy,
		title: record.title,
		startTime: record.startTime.toISOString(),
		endTime: record.endTime.toISOString(),
		requestedFor: record.requestedFor,
		room: record.room as RoomBookingResponse["room"],
		attachmentUrl: record.attachmentUrl,
		status: record.status as RoomBookingResponse["status"],
		createdAt: record.createdAt.toISOString(),
		user: record.user ?? null,
	};
}

/** Include clause reused across queries. */
const USER_INCLUDE = {
	user: { select: { id: true, fullName: true } },
} as const;

@Injectable()
export class RoomBookingService {
	private readonly logger = new Logger(RoomBookingService.name);

	constructor(
		private readonly db: DbService,
		private readonly availability: RoomBookingAvailabilityService,
		private readonly storage: SupabaseStorageService,
	) {}

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------

	private validateTimeRange(startTime: Date, endTime: Date): void {
		const durationMs = endTime.getTime() - startTime.getTime();
		const durationMinutes = durationMs / (1000 * 60);

		if (durationMinutes < MIN_DURATION_MINUTES) {
			throw new AppError("ROOM_BOOKING.INVALID_TIME_RANGE");
		}
	}

	private isAdminRole(role: RoleType): boolean {
		return (ADMIN_BOOKING_ROLES as readonly string[]).includes(role);
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

		this.logger.debug(
			`getList filters: ${JSON.stringify({
				status,
				room,
				date,
				startDate,
				endDate,
				bookedBy,
				limit,
				page,
			})}`,
		);

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
				include: USER_INCLUDE,
				orderBy: { startTime: "asc" },
				take: limit,
				skip,
			}),
		]);

		const totalPages = Math.ceil(totalItems / limit) || 1;

		// Sign attachment URLs so clients can access them directly
		const rawBookings = bookings.map(toResponse);
		const attachmentPaths = rawBookings
			.map((booking) => booking.attachmentUrl)
			.filter((path): path is string => Boolean(path));

		const signedAttachments = await this.storage.getSignedUrls(
			BOOKING_ATTACHMENTS_BUCKET,
			attachmentPaths,
		);

		const signedUrlByPath = new Map(
			signedAttachments.map((attachment) => [
				attachment.path,
				attachment.signedUrl,
			]),
		);

		const signedBookings = rawBookings.map((booking) => {
			if (!booking.attachmentUrl) {
				return booking;
			}

			return {
				...booking,
				attachmentUrl: signedUrlByPath.get(booking.attachmentUrl) ?? null,
			};
		});

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
			include: USER_INCLUDE,
		});

		if (!booking) {
			throw new AppError("ROOM_BOOKING.NOT_FOUND");
		}

		const response = toResponse(booking);
		if (response.attachmentUrl) {
			const { signedUrl } = await this.storage.getSignedUrlOrThrow(
				BOOKING_ATTACHMENTS_BUCKET,
				response.attachmentUrl,
			);
			return { ...response, attachmentUrl: signedUrl };
		}
		return response;
	}

	// ---------------------------------------------------------------------------
	// POST /bookings
	// ---------------------------------------------------------------------------

	async create(
		input: CreateRoomBookingInput,
		userId: string,
		userRole: RoleType,
	): Promise<RoomBookingResponse> {
		const startTime = new Date(input.startTime);
		const endTime = new Date(input.endTime);

		// Scenario 3 — Validate time range
		this.validateTimeRange(startTime, endTime);

		// Edge Case: Conflict check against CONFIRMED bookings
		const available = await this.availability.checkAvailability(
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
				startTime,
				endTime,
				requestedFor: input.requestedFor,
				room: input.room as never, // Prisma enum cast
				attachmentUrl: input.attachmentUrl ?? null,
				status,
			},
			include: USER_INCLUDE,
		});

		this.logger.log(
			`Booking created: ${booking.id} by user ${userId} with status "${status}"`,
		);

		return toResponse(booking);
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
			include: USER_INCLUDE,
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
			const available = await this.availability.checkAvailability(
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
			include: USER_INCLUDE,
		});

		this.logger.log(`Booking ${input.id} status updated to "${input.status}"`);

		return toResponse(updated);
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
			include: USER_INCLUDE,
		});

		if (!booking) {
			throw new AppError("ROOM_BOOKING.NOT_FOUND");
		}

		// Scenario 1 — Ownership check (owner-only editing)
		if (booking.bookedBy !== userId) {
			throw new AppError("ROOM_BOOKING.FORBIDDEN");
		}

		const newStartTime = input.startTime
			? new Date(input.startTime)
			: booking.startTime;
		const newEndTime = input.endTime
			? new Date(input.endTime)
			: booking.endTime;
		const newRoom = input.room ?? booking.room;
		const timesChanged =
			input.startTime !== undefined ||
			input.endTime !== undefined ||
			input.room !== undefined;
		const shouldResetToPending =
			userRole === "councilor" &&
			timesChanged &&
			booking.status === "confirmed";

		if (timesChanged) {
			// Scenario 3 — Validate new time range
			this.validateTimeRange(newStartTime, newEndTime);

			// Conflict check excluding this booking's own slot
			const available = await this.availability.checkAvailability(
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
				...(input.requestedFor !== undefined && {
					requestedFor: input.requestedFor,
				}),
				...(input.room !== undefined && { room: input.room as never }),
				...(input.attachmentUrl !== undefined && {
					attachmentUrl: input.attachmentUrl,
				}),
				startTime: newStartTime,
				endTime: newEndTime,
				...(shouldResetToPending && { status: "pending" }),
			},
			include: USER_INCLUDE,
		});

		if (shouldResetToPending) {
			this.logger.debug(
				`Booking ${booking.id} status reset to pending after schedule/room edit`,
			);
		}

		const oldAttachmentPath = booking.attachmentUrl;
		const newAttachmentPath = updated.attachmentUrl;
		const attachmentChanged =
			oldAttachmentPath !== null && oldAttachmentPath !== newAttachmentPath;

		if (attachmentChanged) {
			await this.storage.deleteFile(
				BOOKING_ATTACHMENTS_BUCKET,
				oldAttachmentPath,
			);
		}

		return toResponse(updated);
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
		});

		if (!booking) {
			throw new AppError("ROOM_BOOKING.NOT_FOUND");
		}

		// Scenario 1 — Ownership check
		if (booking.bookedBy !== userId && !this.isAdminRole(userRole)) {
			throw new AppError("ROOM_BOOKING.FORBIDDEN");
		}

		await this.db.roomBooking.delete({ where: { id } });

		if (booking.attachmentUrl) {
			await this.storage.deleteFile(
				BOOKING_ATTACHMENTS_BUCKET,
				booking.attachmentUrl,
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
