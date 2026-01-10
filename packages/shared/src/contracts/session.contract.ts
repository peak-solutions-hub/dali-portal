import { oc } from "@orpc/contract";
import {
	GetSessionByIdSchema,
	GetSessionListSchema,
	SessionListResponseSchema,
	SessionWithAgendaSchema,
} from "../schemas/session.schema";

/**
 * List sessions endpoint
 */
export const listSessions = oc
	.route({
		method: "GET",
		path: "/sessions",
		summary: "List council sessions",
		description:
			"Public endpoint to retrieve a paginated list of council sessions with filtering and sorting capabilities.",
		tags: ["Sessions", "Public"],
	})
	.errors({
		BAD_REQUEST: {
			status: 400,
			description: "Invalid parameters (e.g., invalid date range)",
		},
	})
	.input(GetSessionListSchema)
	.output(SessionListResponseSchema);

/**
 * Get session by ID endpoint
 */
export const getSessionById = oc
	.route({
		method: "GET",
		path: "/sessions/{id}",
		summary: "Get session by ID",
		description:
			"Public endpoint to retrieve detailed information for a specific council session, including the full agenda with all agenda items.",
		tags: ["Sessions", "Public"],
	})
	.errors({
		NOT_FOUND: {
			status: 404,
			description: "Session not found",
		},
	})
	.input(GetSessionByIdSchema)
	.output(SessionWithAgendaSchema);

/**
 * Session contract (exported for root router)
 */
export const sessionContract = {
	list: listSessions,
	getById: getSessionById,
};
