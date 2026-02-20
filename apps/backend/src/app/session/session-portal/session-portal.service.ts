import { Injectable } from "@nestjs/common";
import {
	type AgendaPdfUrlResponse,
	AppError,
	type GetAgendaPdfUrlInput,
	type GetSessionByIdInput,
	type GetSessionListInput,
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
	 * Get a single session by ID with full agenda (PUBLIC)
	 */
	async findOne(input: GetSessionByIdInput): Promise<SessionWithAgenda> {
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

		if (!session || session.status === "draft") {
			throw new AppError("SESSION.NOT_FOUND");
		}

		if (!session.agendaFilePath) {
			throw new AppError("SESSION.NOT_FOUND");
		}

		const result = await this.storage.getSignedUrl(
			"agendas",
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
}
