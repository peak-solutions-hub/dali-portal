import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import type {
	GetSessionByIdInput,
	GetSessionListInput,
	SessionListResponse,
	SessionStatus,
	SessionType,
	SessionWithAgenda,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import { Prisma } from "@/generated/prisma/client";

@Injectable()
export class SessionService {
	constructor(private readonly db: DbService) {}

	/**
	 * List sessions with filtering, sorting, and cursor-based pagination
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
			cursor,
		} = input;

		// Validate date range
		if (dateFrom && dateTo && dateFrom > dateTo) {
			throw new ORPCError("BAD_REQUEST", {
				message: "dateFrom must be before or equal to dateTo",
			});
		}

		// Build where clause with filters
		const where: Prisma.SessionWhereInput = {
			AND: [
				// Filter by type (if provided) - supports both single and array
				type
					? Array.isArray(type)
						? { type: { in: type as SessionType[] } }
						: { type: type as SessionType }
					: {},
				// Filter by status (already validated by schema to be scheduled/completed only)
				status
					? Array.isArray(status)
						? { status: { in: status as SessionStatus[] } }
						: { status: status as SessionStatus }
					: { status: { in: ["scheduled", "completed"] } },
				// Filter by date range
				dateFrom ? { scheduleDate: { gte: dateFrom } } : {},
				dateTo ? { scheduleDate: { lte: dateTo } } : {},
				// Cursor-based pagination: only get sessions after cursor
				cursor ? { id: { lt: cursor } } : {},
			],
		};

		// Determine sort order
		const orderBy: Prisma.SessionOrderByWithRelationInput =
			sortBy === "date"
				? { scheduleDate: sortDirection }
				: { scheduleDate: "desc" };

		// Fetch limit + 1 to determine if there's a next page
		const sessions = await this.db.session.findMany({
			where,
			orderBy,
			take: limit + 1,
		});

		// Check if there's a next page
		const hasNextPage = sessions.length > limit;

		// Remove the extra item if we have more than limit
		const sessionList = hasNextPage ? sessions.slice(0, limit) : sessions;

		// Get total count for pagination info
		const totalCount = await this.db.session.count({ where });

		// Get next cursor (ID of last item in current page)
		const nextCursor =
			hasNextPage && sessionList.length > 0
				? sessionList[sessionList.length - 1].id
				: null;

		// Transform Prisma BigInt/Decimal to number for API
		const transformedSessions = sessionList.map((session) => ({
			...session,
			sessionNumber: Number(session.sessionNumber),
		}));

		return {
			sessions: transformedSessions,
			pagination: {
				hasNextPage,
				nextCursor,
				totalCount,
			},
		};
	}

	/**
	 * Get a single session by ID with full agenda
	 */
	async findOne(input: GetSessionByIdInput): Promise<SessionWithAgenda> {
		const session = await this.db.session.findUnique({
			where: { id: input.id },
			include: {
				sessionAgendaItem: {
					orderBy: { orderIndex: "asc" },
				},
			},
		});

		if (!session) {
			throw new ORPCError("NOT_FOUND", {
				message: "Session not found",
			});
		}

		// Only return scheduled and completed sessions to public
		if (session.status === "draft") {
			throw new ORPCError("NOT_FOUND", {
				message: "Session not found",
			});
		}

		// Transform Prisma BigInt/Decimal to number for API
		const transformedSession = {
			...session,
			sessionNumber: Number(session.sessionNumber),
			agendaItems: session.sessionAgendaItem.map((item) => ({
				...item,
				orderIndex: Number(item.orderIndex),
			})),
		};

		// Remove the sessionAgendaItem property (we renamed it to agendaItems)
		const { sessionAgendaItem: _, ...result } = transformedSession;

		return result as SessionWithAgenda;
	}
}
