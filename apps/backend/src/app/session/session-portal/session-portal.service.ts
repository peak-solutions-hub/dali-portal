import { Injectable, Logger } from "@nestjs/common";
import {
	AGENDA_DOCUMENT_ELIGIBLE_PURPOSE,
	AGENDA_DOCUMENT_ELIGIBLE_STATUS,
	type AgendaPdfUrlResponse,
	AppError,
	type GetAgendaPdfUrlInput,
	type GetPublicDocumentFileUrlInput,
	type GetSessionByIdInput,
	type GetSessionListInput,
	isDocumentFilePubliclyAccessible,
	isSessionAgendaPdfPubliclyAccessible,
	type PublicDocumentFileUrlResponse,
	SESSION_AGENDA_BUCKET,
	SESSION_DOCUMENTS_BUCKET,
	type SessionListResponse,
	type SessionWithAgenda,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";
import {
	Prisma,
	type SessionStatus,
	type SessionType,
} from "@/generated/prisma/client";

@Injectable()
export class SessionPortalService {
	private readonly logger = new Logger(SessionPortalService.name);

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

	/* ============================
	   Public Endpoints
	   ============================ */

	/**
	 * List sessions with filtering, sorting, and offset pagination (PUBLIC)
	 */
	async findAll(input: GetSessionListInput): Promise<SessionListResponse> {
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
			defaultStatusFilter: ["scheduled", "completed"],
		});

		const order: Prisma.SessionOrderByWithRelationInput =
			sortBy === "date"
				? { scheduleDate: sortDirection }
				: { scheduleDate: "desc" };

		try {
			const totalCount = await this.db.session.count({ where });
			const totalPages = Math.ceil(totalCount / limit);

			const sessions = await this.db.session.findMany({
				where,
				orderBy: order,
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
	 * Get a single session by ID with full agenda (PUBLIC)
	 */
	async findOne(input: GetSessionByIdInput): Promise<SessionWithAgenda> {
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
									receivedAt: true,
									legislativeDocument: {
										select: {
											authorNames: true,
											sponsorNames: true,
										},
										take: 1,
									},
								},
							},
						},
					},
				},
			});

			if (!session) {
				throw new AppError("SESSION.NOT_FOUND");
			}

			// Only return scheduled and completed sessions to public
			if (session.status === "draft") {
				throw new AppError("SESSION.NOT_FOUND");
			}

			// Flatten legislativeDocument into authors/sponsors on raw data before transforming
			const flattenedSession = {
				...session,
				sessionAgendaItem: session.sessionAgendaItem.map((item) => {
					if (!item.document) return item;
					const { legislativeDocument, receivedAt, ...docRest } = item.document;
					const legDoc = (
						legislativeDocument as {
							authorNames: string[];
							sponsorNames: string[];
						}[]
					)?.[0];
					return {
						...item,
						document: {
							...docRest,
							receivedAt: receivedAt.toISOString(),
							authors: legDoc?.authorNames ?? [],
							sponsors: legDoc?.sponsorNames ?? [],
						},
					};
				}),
			};

			return this.transformSessionWithAgenda(
				flattenedSession,
			) as SessionWithAgenda;
		} catch (error) {
			if (error instanceof AppError) throw error;
			this.logger.error("Failed to load session by ID", error);
			throw new AppError("SESSION.FETCH_FAILED");
		}
	}

	/**
	 * Get a signed URL for the session agenda PDF (PUBLIC)
	 */
	async getAgendaPdfUrl(
		input: GetAgendaPdfUrlInput,
	): Promise<AgendaPdfUrlResponse> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
			select: { status: true, agendaFilePath: true },
		});

		if (
			!session ||
			!isSessionAgendaPdfPubliclyAccessible(
				session.status,
				session.agendaFilePath,
			)
		) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		// Narrow agendaFilePath for TypeScript — guaranteed non-null by the predicate above
		if (!session.agendaFilePath) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		const result = await this.storage.getSignedUrl(
			SESSION_AGENDA_BUCKET,
			session.agendaFilePath,
		);

		if (!result.signedUrl) {
			throw new AppError("STORAGE.SIGNED_URL_FAILED");
		}

		return {
			signedUrl: result.signedUrl,
			fileName: result.fileName,
		};
	}

	/**
	 * Get a signed URL for a legislative document file (PUBLIC).
	 *
	 * Security guarantees:
	 * - Document must have status='approved' AND purpose='for_agenda' (both required).
	 *   A document that is approved but not for_agenda (e.g. for_filing) is not served.
	 *   A document with purpose for_agenda but not yet approved is also not served.
	 * - Document must be linked to at least one agenda item on a session
	 *   that is scheduled or completed (not draft) — prevents serving
	 *   documents that were approved internally but never made public.
	 * - Signs only the latest document version file path.
	 */
	async getPublicDocumentFileUrl(
		input: GetPublicDocumentFileUrlInput,
	): Promise<PublicDocumentFileUrlResponse> {
		// Single query: verify document visibility + session status in one shot
		const document = await this.db.document.findUnique({
			where: {
				id: input.documentId,
				// Must meet both conditions: approved status AND for_agenda purpose
				status: AGENDA_DOCUMENT_ELIGIBLE_STATUS,
				purpose: AGENDA_DOCUMENT_ELIGIBLE_PURPOSE,
			},
			select: {
				id: true,
				status: true,
				purpose: true,
				// Verify it's linked to at least one public session agenda item
				sessionAgendaItem: {
					where: {
						session: {
							status: { in: ["scheduled", "completed"] },
						},
					},
					take: 1,
					select: {
						id: true,
						session: { select: { status: true } },
					},
				},
				// Get the latest version file path
				documentVersion: {
					orderBy: { versionNumber: "desc" },
					take: 1,
					select: { filePath: true },
				},
			},
		});

		const linkedSession = document?.sessionAgendaItem[0]?.session;

		// Document doesn't exist, isn't eligible, isn't on any public session,
		// or has no file
		if (
			!document ||
			!linkedSession ||
			!isDocumentFilePubliclyAccessible(
				linkedSession.status,
				document.status,
				document.purpose,
			) ||
			document.documentVersion.length === 0 ||
			!document.documentVersion[0].filePath
		) {
			throw new AppError("GENERAL.NOT_FOUND");
		}

		const filePath = document.documentVersion[0].filePath;

		const result = await this.storage.getSignedUrl(
			SESSION_DOCUMENTS_BUCKET,
			filePath,
		);

		if (!result.signedUrl) {
			throw new AppError("STORAGE.SIGNED_URL_FAILED");
		}

		const ext = filePath.split(".").pop()?.toLowerCase();
		const contentTypeMap: Record<string, string> = {
			pdf: "application/pdf",
			doc: "application/msword",
			docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
		};

		return {
			signedUrl: result.signedUrl,
			fileName: result.fileName,
			contentType: ext ? contentTypeMap[ext] : undefined,
		};
	}
}
