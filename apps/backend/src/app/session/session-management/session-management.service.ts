import { Injectable, Logger } from "@nestjs/common";
import {
	type AdminSessionListResponse,
	type AdminSessionResponse,
	type AdminSessionWithAgenda,
	type AgendaUploadUrlResponse,
	AppError,
	type ApprovedDocumentListResponse,
	type CreateSessionInput,
	type DeleteSessionInput,
	type DocumentFileUrlResponse,
	type GetAgendaUploadUrlInput,
	type GetDocumentFileUrlInput,
	type GetSessionByIdInput,
	type GetSessionListAdminInput,
	type MarkSessionCompleteInput,
	type PublishSessionInput,
	type RemoveAgendaPdfInput,
	type SaveAgendaPdfInput,
	type SaveSessionDraftInput,
	type SessionStatus,
	type SessionType,
	type UnpublishSessionInput,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";
import {
	Prisma,
	type SessionType as PrismaSessionType,
	type SessionSection,
} from "@/generated/prisma/client";

@Injectable()
export class SessionManagementService {
	private readonly logger = new Logger(SessionManagementService.name);

	constructor(
		private readonly db: DbService,
		private readonly storage: SupabaseStorageService,
	) {}

	/* ============================
	   Shared Helpers
	   ============================ */

	private transformSession<
		T extends { sessionNumber: Prisma.Decimal | number },
	>(session: T): Omit<T, "sessionNumber"> & { sessionNumber: number } {
		return {
			...session,
			sessionNumber: Number(session.sessionNumber),
		};
	}

	private transformSessionWithAgenda<
		TItem extends { orderIndex: Prisma.Decimal | number },
		T extends {
			sessionNumber: Prisma.Decimal | number;
			sessionAgendaItem: TItem[];
		},
	>(
		session: T,
	): Omit<T, "sessionNumber" | "sessionAgendaItem"> & {
		sessionNumber: number;
		agendaItems: (Omit<TItem, "orderIndex"> & { orderIndex: number })[];
	} {
		const { sessionAgendaItem, ...rest } = session;
		return {
			...rest,
			sessionNumber: Number(session.sessionNumber),
			agendaItems: sessionAgendaItem.map((item) => ({
				...item,
				orderIndex: Number(item.orderIndex),
			})),
		} as Omit<T, "sessionNumber" | "sessionAgendaItem"> & {
			sessionNumber: number;
			agendaItems: (Omit<TItem, "orderIndex"> & { orderIndex: number })[];
		};
	}

	private buildSessionWhere(input: {
		type?: string | string[];
		status?: string | string[];
		dateFrom?: Date;
		dateTo?: Date;
		defaultStatusFilter?: string[];
	}): Prisma.SessionWhereInput {
		const { type, status, dateFrom, dateTo, defaultStatusFilter } = input;

		if (dateFrom && dateTo && dateFrom > dateTo) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"dateFrom must be before or equal to dateTo",
			);
		}

		return {
			AND: [
				type
					? Array.isArray(type)
						? { type: { in: type as SessionType[] } }
						: { type: type as SessionType }
					: {},
				status
					? Array.isArray(status)
						? { status: { in: status as SessionStatus[] } }
						: { status: status as SessionStatus }
					: defaultStatusFilter
						? { status: { in: defaultStatusFilter as SessionStatus[] } }
						: {},
				dateFrom ? { scheduleDate: { gte: dateFrom } } : {},
				dateTo ? { scheduleDate: { lte: dateTo } } : {},
			],
		};
	}

	/* ============================
	   Admin Endpoints
	   ============================ */

	/**
	 * List sessions including drafts (ADMIN)
	 */
	async adminFindAll(
		input: GetSessionListAdminInput,
	): Promise<AdminSessionListResponse> {
		const {
			type,
			status,
			dateFrom,
			dateTo,
			sortBy,
			sortDirection,
			limit,
			page,
		} = input;

		const skip = (page - 1) * limit;

		const where = this.buildSessionWhere({
			type,
			status,
			dateFrom,
			dateTo,
		});

		const orderBy: Prisma.SessionOrderByWithRelationInput =
			sortBy === "date"
				? { scheduleDate: sortDirection }
				: { scheduleDate: "desc" };

		const totalCount = await this.db.session.count({ where });
		const totalPages = Math.ceil(totalCount / limit);

		const sessions = await this.db.session.findMany({
			where,
			orderBy,
			skip,
			take: limit,
		});

		return {
			sessions: sessions.map((s) => this.transformSession(s)),
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				itemsPerPage: limit,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		};
	}

	/**
	 * Get a single session by ID with full agenda (ADMIN - includes drafts)
	 */
	async adminFindOne(
		input: GetSessionByIdInput,
	): Promise<AdminSessionWithAgenda> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
			include: {
				sessionAgendaItem: {
					orderBy: { orderIndex: "asc" },
					include: {
						document: {
							select: {
								id: true,
								codeNumber: true,
								title: true,
								type: true,
								status: true,
								purpose: true,
								classification: true,
							},
						},
					},
				},
			},
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		return this.transformSessionWithAgenda(session) as AdminSessionWithAgenda;
	}

	/**
	 * Create a new draft session (ADMIN)
	 */
	async create(input: CreateSessionInput): Promise<AdminSessionResponse> {
		// Check for duplicate session on the same date
		const dateStart = new Date(input.scheduleDate);
		dateStart.setUTCHours(0, 0, 0, 0);
		const dateEnd = new Date(dateStart);
		dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

		const existing = await this.db.session.findFirst({
			where: {
				scheduleDate: { gte: dateStart, lt: dateEnd },
			},
		});

		if (existing) {
			this.logger.warn(
				`Duplicate session creation attempt for date ${input.scheduleDate}`,
			);
			throw new AppError("SESSION.DUPLICATE_DATE");
		}

		// Auto-generate next session number
		const maxResult = await this.db.session.aggregate({
			_max: { sessionNumber: true },
		});
		const nextNumber = maxResult._max.sessionNumber
			? Number(maxResult._max.sessionNumber) + 1
			: 1;

		try {
			const session = await this.db.session.create({
				data: {
					sessionNumber: nextNumber,
					scheduleDate: input.scheduleDate,
					type: input.type as PrismaSessionType,
					status: "draft",
				},
			});

			this.logger.log(`Session #${nextNumber} created as draft`);
			return this.transformSession(session) as AdminSessionResponse;
		} catch (error) {
			this.logger.error("Failed to create session", error);
			throw new AppError("SESSION.CREATION_FAILED");
		}
	}

	/**
	 * Save session draft — replaces all agenda items (ADMIN)
	 */
	async saveDraft(
		input: SaveSessionDraftInput,
	): Promise<AdminSessionWithAgenda> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status === "completed") {
			throw new AppError("SESSION.NOT_DRAFT");
		}

		// Replace all agenda items in a transaction
		await this.db.$transaction(async (tx) => {
			// Delete existing agenda items
			await tx.sessionAgendaItem.deleteMany({
				where: { sessionId: input.id },
			});

			// Collect linked document IDs to fetch their attachment info
			const linkedDocIds = input.agendaItems
				.map((item) => item.linkedDocument)
				.filter((id): id is string => !!id);

			// Fetch latest version file info for all linked documents in one query
			const documentVersions =
				linkedDocIds.length > 0
					? await tx.documentVersion.findMany({
							where: { documentId: { in: linkedDocIds } },
							orderBy: { versionNumber: "desc" },
							distinct: ["documentId"],
							select: {
								documentId: true,
								filePath: true,
							},
						})
					: [];

			const versionMap = new Map(
				documentVersions.map((v) => [v.documentId, v]),
			);

			// Create new agenda items
			if (input.agendaItems.length > 0) {
				await tx.sessionAgendaItem.createMany({
					data: input.agendaItems.map((item) => {
						// Auto-fill attachment fields from the linked document's latest version
						let attachmentPath = item.attachmentPath ?? null;
						let attachmentName = item.attachmentName ?? null;

						if (item.linkedDocument) {
							const version = versionMap.get(item.linkedDocument);
							if (version?.filePath) {
								attachmentPath = version.filePath;
								// Extract file name from the file path
								attachmentName =
									version.filePath.split("/").pop() ?? attachmentName;
							}
						}

						return {
							sessionId: input.id,
							section: item.section as SessionSection,
							orderIndex: item.orderIndex,
							contentText: item.contentText ?? null,
							linkedDocument: item.linkedDocument ?? null,
							attachmentPath,
							attachmentName,
						};
					}),
				});
			}
		});

		// Return the updated session with agenda
		return this.adminFindOne({ id: input.id });
	}

	/**
	 * Publish session: draft → scheduled (ADMIN)
	 */
	async publish(input: PublishSessionInput): Promise<AdminSessionResponse> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status !== "draft") {
			throw new AppError("SESSION.NOT_DRAFT");
		}

		const updated = await this.db.session.update({
			where: { id: input.id },
			data: { status: "scheduled" },
		});

		this.logger.log(`Session #${Number(session.sessionNumber)} published`);
		return this.transformSession(updated) as AdminSessionResponse;
	}

	/**
	 * Unpublish session: scheduled → draft (ADMIN).
	 * Also removes any uploaded agenda PDF from storage and database.
	 */
	async unpublish(input: UnpublishSessionInput): Promise<AdminSessionResponse> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status !== "scheduled") {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		const updated = await this.db.session.update({
			where: { id: input.id },
			data: { status: "draft", agendaFilePath: null },
		});

		// Delete the agenda PDF from storage if one was uploaded
		if (session.agendaFilePath) {
			await this.storage.deleteFile("agendas", session.agendaFilePath);
		}

		this.logger.log(`Session #${Number(session.sessionNumber)} unpublished`);
		return this.transformSession(updated) as AdminSessionResponse;
	}

	/**
	 * Mark session as completed: scheduled → completed (ADMIN)
	 */
	async markComplete(
		input: MarkSessionCompleteInput,
	): Promise<AdminSessionResponse> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status !== "scheduled") {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		const updated = await this.db.session.update({
			where: { id: input.id },
			data: { status: "completed" },
		});

		this.logger.log(`Session #${Number(session.sessionNumber)} completed`);
		return this.transformSession(updated) as AdminSessionResponse;
	}

	/**
	 * Delete a draft session (ADMIN)
	 */
	async delete(input: DeleteSessionInput): Promise<AdminSessionResponse> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status !== "draft") {
			throw new AppError("SESSION.DELETE_NOT_DRAFT");
		}

		// Delete agenda items first, then session
		await this.db.$transaction(async (tx) => {
			await tx.sessionAgendaItem.deleteMany({
				where: { sessionId: input.id },
			});
			await tx.session.delete({
				where: { id: input.id },
			});
		});

		this.logger.log(`Session #${Number(session.sessionNumber)} deleted`);
		return this.transformSession(session) as AdminSessionResponse;
	}

	/**
	 * List approved documents for agenda linking (ADMIN)
	 */
	async getApprovedDocuments(): Promise<ApprovedDocumentListResponse> {
		const documents = await this.db.document.findMany({
			where: {
				OR: [{ status: "approved" }, { purpose: "for_agenda" }],
			},
			select: {
				id: true,
				codeNumber: true,
				title: true,
				type: true,
				status: true,
				purpose: true,
				classification: true,
				receivedAt: true,
				legislativeDocument: {
					select: {
						authorNames: true,
						sponsorNames: true,
					},
					take: 1,
				},
			},
			orderBy: { receivedAt: "desc" },
		});

		return {
			documents: documents.map((doc) => {
				const legDoc = doc.legislativeDocument[0];
				return {
					id: doc.id,
					title: doc.title,
					type: doc.type,
					number: doc.codeNumber,
					classification: doc.classification,
					status: doc.status,
					purpose: doc.purpose,
					receivedAt: doc.receivedAt.toISOString(),
					authors: legDoc?.authorNames ?? [],
					sponsors: legDoc?.sponsorNames ?? [],
				};
			}),
		};
	}

	/* ============================
	   Document File URL
	   ============================ */

	async getDocumentFileUrl(
		input: GetDocumentFileUrlInput,
	): Promise<DocumentFileUrlResponse> {
		// Look up the latest version of the document
		const version = await this.db.documentVersion.findFirst({
			where: { documentId: input.documentId },
			orderBy: { versionNumber: "desc" },
		});

		if (!version || !version.filePath) {
			throw new AppError("GENERAL.NOT_FOUND", "Document file not found");
		}

		const result = await this.storage.getSignedUrl(
			"documents",
			version.filePath,
		);

		if (!result.signedUrl) {
			throw new AppError(
				"STORAGE.SIGNED_URL_FAILED",
				"Failed to generate document file URL",
			);
		}

		// Infer content type from file extension
		const ext = version.filePath.split(".").pop()?.toLowerCase();
		const contentTypeMap: Record<string, string> = {
			pdf: "application/pdf",
			doc: "application/msword",
			docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
		};

		return {
			fileName: result.fileName,
			signedUrl: result.signedUrl,
			contentType: ext ? contentTypeMap[ext] : undefined,
		};
	}

	/* ============================
	   Agenda PDF Management
	   ============================ */

	/**
	 * Get a signed upload URL for session agenda PDF (ADMIN)
	 */
	async getAgendaUploadUrl(
		input: GetAgendaUploadUrlInput,
	): Promise<AgendaUploadUrlResponse> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status !== "scheduled") {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		try {
			const path = this.storage.generateUploadPath(
				`session-${input.id}`,
				input.fileName,
			);

			const result = await this.storage.createSignedUploadUrl("agendas", path);

			this.logger.log(
				`Generated agenda upload URL for session #${Number(session.sessionNumber)}`,
			);

			return {
				signedUrl: result.signedUrl,
				token: result.token,
				path: result.path,
			};
		} catch (error) {
			this.logger.error("Failed to generate agenda upload URL", error);
			throw new AppError("SESSION.AGENDA_UPLOAD_FAILED");
		}
	}

	/**
	 * Save agenda PDF path on the session record (ADMIN).
	 * The PDF is displayed only in the public PDF view, not as an agenda item.
	 */
	async saveAgendaPdf(
		input: SaveAgendaPdfInput,
	): Promise<AdminSessionResponse> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status !== "scheduled") {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		// Only persist the file path — no tracking agenda item is created
		const updated = await this.db.session.update({
			where: { id: input.id },
			data: { agendaFilePath: input.filePath },
		});

		this.logger.log(
			`Agenda PDF saved for session #${Number(session.sessionNumber)}`,
		);
		return this.transformSession(updated) as AdminSessionResponse;
	}

	/**
	 * Remove agenda PDF from session (ADMIN)
	 */
	async removeAgendaPdf(
		input: RemoveAgendaPdfInput,
	): Promise<AdminSessionResponse> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status !== "scheduled") {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		// Clear the agendaFilePath on the session
		const updated = await this.db.session.update({
			where: { id: input.id },
			data: { agendaFilePath: null },
		});

		// Delete the actual file from the storage bucket
		if (session.agendaFilePath) {
			await this.storage.deleteFile("agendas", session.agendaFilePath);
		}

		this.logger.log(
			`Agenda PDF removed for session #${Number(session.sessionNumber)}`,
		);
		return this.transformSession(updated) as AdminSessionResponse;
	}
}
