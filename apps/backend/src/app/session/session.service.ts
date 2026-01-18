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
	 * List sessions with filtering, sorting, and offset pagination
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

		// Validate date range
		if (dateFrom && dateTo && dateFrom > dateTo) {
			throw new ORPCError("BAD_REQUEST", {
				message: "dateFrom must be before or equal to dateTo",
			});
		}

		// Calculate offset
		const skip = (page - 1) * limit;

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
			],
		};

		// Determine sort order
		const orderBy: Prisma.SessionOrderByWithRelationInput =
			sortBy === "date"
				? { scheduleDate: sortDirection }
				: { scheduleDate: "desc" };

		// Get total count for pagination calculations
		const totalCount = await this.db.session.count({ where });
		const totalPages = Math.ceil(totalCount / limit);

		// Fetch sessions with offset and limit
		const sessions = await this.db.session.findMany({
			where,
			orderBy,
			skip,
			take: limit,
		});

		// Transform Prisma BigInt/Decimal to number for API
		const transformedSessions = sessions.map((session) => ({
			...session,
			sessionNumber: Number(session.sessionNumber),
		}));

		return {
			sessions: transformedSessions,
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
