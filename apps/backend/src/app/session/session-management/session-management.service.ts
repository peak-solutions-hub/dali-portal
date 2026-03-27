import { Injectable, Logger } from "@nestjs/common";
import {
	type AdminSessionListResponse,
	type AdminSessionResponse,
	type AdminSessionWithAgenda,
	AGENDA_DOCUMENT_ELIGIBLE_PURPOSE,
	AGENDA_DOCUMENT_ELIGIBLE_STATUS,
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
	getInitialSessionStatus,
	isSessionEditable,
	isSessionTransitionAllowed,
	type MarkSessionCompleteInput,
	PH_TIME_ZONE,
	type PublishSessionInput,
	type RemoveAgendaItemInput,
	type RemoveAgendaPdfInput,
	type SaveAgendaPdfInput,
	type SaveSessionDraftInput,
	SESSION_AGENDA_BUCKET,
	SESSION_DOCUMENTS_BUCKET,
	SessionStatus,
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
			throw new AppError("SESSION.INVALID_DATE_RANGE");
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

	private getPhtDayRange(date: Date): { start: Date; end: Date } {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: PH_TIME_ZONE,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(date);

		const year = Number(parts.find((part) => part.type === "year")?.value);
		const month = Number(parts.find((part) => part.type === "month")?.value);
		const day = Number(parts.find((part) => part.type === "day")?.value);

		if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
			throw new AppError("SESSION.CREATION_FAILED");
		}

		// PHT midnight equals UTC-8h for storage comparisons.
		const start = new Date(Date.UTC(year, month - 1, day, -8, 0, 0, 0));
		const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

		return { start, end };
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

		try {
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
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError("SESSION.LIST_FAILED");
		}
	}

	/**
	 * Get a single session by ID with full agenda (ADMIN - includes drafts)
	 */
	async adminFindOne(
		input: GetSessionByIdInput,
	): Promise<AdminSessionWithAgenda> {
		try {
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
		} catch (error) {
			if (error instanceof AppError) throw error;
			this.logger.error("Failed to load session by ID", error);
			throw new AppError("SESSION.FETCH_FAILED");
		}
	}

	/**
	 * Create a new draft session (ADMIN)
	 */
	async create(input: CreateSessionInput): Promise<AdminSessionResponse> {
		// Check for duplicate session on the same Philippine calendar date.
		const { start: dateStart, end: dateEnd } = this.getPhtDayRange(
			new Date(input.scheduleDate),
		);

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
					status: getInitialSessionStatus(),
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

		if (!isSessionEditable(session.status as SessionStatus)) {
			throw new AppError("SESSION.NOT_DRAFT");
		}

		// Replace all agenda items in a transaction
		await this.db
			.$transaction(async (tx) => {
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
			})
			.catch((error) => {
				this.logger.error("Failed to save session draft", error);
				throw new AppError("SESSION.SAVE_FAILED");
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

		if (
			!isSessionTransitionAllowed(
				session.status as SessionStatus,
				SessionStatus.SCHEDULED,
			)
		) {
			throw new AppError("SESSION.NOT_DRAFT");
		}

		try {
			const updated = await this.db.session.update({
				where: { id: input.id },
				data: { status: SessionStatus.SCHEDULED },
			});

			this.logger.log(`Session #${Number(session.sessionNumber)} published`);
			return this.transformSession(updated) as AdminSessionResponse;
		} catch (error) {
			this.logger.error("Failed to publish session", error);
			throw new AppError("SESSION.PUBLISH_FAILED");
		}
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

		if (session.status !== SessionStatus.SCHEDULED) {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		try {
			const updated = await this.db.session.update({
				where: { id: input.id },
				data: { status: SessionStatus.DRAFT, agendaFilePath: null },
			});

			// Delete the agenda PDF from storage if one was uploaded
			if (session.agendaFilePath) {
				await this.storage.deleteFile(
					SESSION_AGENDA_BUCKET,
					session.agendaFilePath,
				);
			}

			this.logger.log(`Session #${Number(session.sessionNumber)} unpublished`);
			return this.transformSession(updated) as AdminSessionResponse;
		} catch (error) {
			if (error instanceof AppError) throw error;
			this.logger.error("Failed to unpublish session", error);
			throw new AppError("SESSION.UNPUBLISH_FAILED");
		}
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

		if (
			!isSessionTransitionAllowed(
				session.status as SessionStatus,
				SessionStatus.COMPLETED,
			)
		) {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		try {
			const updated = await this.db.session.update({
				where: { id: input.id },
				data: { status: SessionStatus.COMPLETED },
			});

			this.logger.log(`Session #${Number(session.sessionNumber)} completed`);
			return this.transformSession(updated) as AdminSessionResponse;
		} catch (error) {
			this.logger.error("Failed to mark session as completed", error);
			throw new AppError("SESSION.COMPLETE_FAILED");
		}
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

		if (!isSessionEditable(session.status as SessionStatus)) {
			throw new AppError("SESSION.DELETE_NOT_DRAFT");
		}

		try {
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
		} catch (error) {
			this.logger.error("Failed to delete session", error);
			throw new AppError("SESSION.DELETE_FAILED");
		}
	}

	/**
	 * List approved documents for agenda linking (ADMIN)
	 */
	async getApprovedDocuments(): Promise<ApprovedDocumentListResponse> {
		try {
			const documents = await this.db.document.findMany({
				where: {
					status: AGENDA_DOCUMENT_ELIGIBLE_STATUS,
					purpose: AGENDA_DOCUMENT_ELIGIBLE_PURPOSE,
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
		} catch (error) {
			if (error instanceof AppError) throw error;
			this.logger.error("Failed to load approved documents", error);
			throw new AppError("SESSION.LIST_FAILED");
		}
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
			SESSION_DOCUMENTS_BUCKET,
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

		if (session.status !== SessionStatus.SCHEDULED) {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		try {
			const path = this.storage.generateUploadPath(
				`session-${input.id}`,
				input.fileName,
			);

			const result = await this.storage.createSignedUploadUrl(
				SESSION_AGENDA_BUCKET,
				path,
			);

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
			throw new AppError("STORAGE.SIGNED_URL_FAILED");
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

		if (session.status !== SessionStatus.SCHEDULED) {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		try {
			// Only persist the file path — no tracking agenda item is created
			const updated = await this.db.session.update({
				where: { id: input.id },
				data: { agendaFilePath: input.filePath },
			});

			this.logger.log(
				`Agenda PDF saved for session #${Number(session.sessionNumber)}`,
			);
			return this.transformSession(updated) as AdminSessionResponse;
		} catch (error) {
			this.logger.error("Failed to save agenda PDF", error);
			throw new AppError("SESSION.AGENDA_SAVE_FAILED");
		}
	}

	/**
	 * Remove a single agenda item from a scheduled session (ADMIN).
	 *
	 * Only permitted when session status is scheduled — draft sessions use
	 * saveDraft (full replace) for all agenda mutations, while completed
	 * sessions are immutable.
	 */
	async removeAgendaItem(
		input: RemoveAgendaItemInput,
	): Promise<AdminSessionWithAgenda> {
		const session = await this.db.session.findUnique({
			where: { id: input.sessionId },
		});

		if (!session) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (session.status !== SessionStatus.SCHEDULED) {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		const agendaItem = await this.db.sessionAgendaItem.findUnique({
			where: { id: input.agendaItemId },
		});

		// Verify the item exists and belongs to this session (prevents IDOR)
		if (!agendaItem || agendaItem.sessionId !== input.sessionId) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		try {
			await this.db.sessionAgendaItem.delete({
				where: { id: input.agendaItemId },
			});

			this.logger.log(
				`Agenda item ${input.agendaItemId} removed from session #${Number(session.sessionNumber)}`,
			);

			return this.adminFindOne({ id: input.sessionId });
		} catch (error) {
			if (error instanceof AppError) throw error;
			this.logger.error("Failed to remove agenda item", error);
			throw new AppError("SESSION.REMOVE_ITEM_FAILED");
		}
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

		if (session.status !== SessionStatus.SCHEDULED) {
			throw new AppError("SESSION.NOT_SCHEDULED");
		}

		try {
			// Clear the agendaFilePath on the session
			const updated = await this.db.session.update({
				where: { id: input.id },
				data: { agendaFilePath: null },
			});

			// Delete the actual file from the storage bucket
			if (session.agendaFilePath) {
				await this.storage.deleteFile(
					SESSION_AGENDA_BUCKET,
					session.agendaFilePath,
				);
			}

			this.logger.log(
				`Agenda PDF removed for session #${Number(session.sessionNumber)}`,
			);
			return this.transformSession(updated) as AdminSessionResponse;
		} catch (error) {
			if (error instanceof AppError) throw error;
			this.logger.error("Failed to remove agenda PDF", error);
			throw new AppError("SESSION.AGENDA_DELETE_FAILED");
		}
	}
}
