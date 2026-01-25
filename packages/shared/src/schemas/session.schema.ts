import { z } from "zod";
import {
	SESSION_SECTION_VALUES,
	SESSION_STATUS_VALUES,
	SESSION_TYPE_VALUES,
} from "../enums/session";

/**
 * Session Type Enum (uses values from enums/session.ts)
 */
export const SessionTypeEnum = z.enum(
	SESSION_TYPE_VALUES as [string, ...string[]],
);

/**
 * Session Status Enum (uses values from enums/session.ts)
 */
export const SessionStatusEnum = z.enum(
	SESSION_STATUS_VALUES as [string, ...string[]],
);

/**
 * Session Section Enum (uses values from enums/session.ts)
 */
export const SessionSectionEnum = z.enum(
	SESSION_SECTION_VALUES as [string, ...string[]],
);

/**
 * Session schema (from session table)
 */
export const SessionSchema = z.object({
	id: z.string().uuid(),
	sessionNumber: z.coerce.number().int(), // Decimal in DB, coerce to number for frontend
	scheduleDate: z.coerce.date(),
	agendaFilePath: z.string().nullable(),
	type: SessionTypeEnum,
	status: SessionStatusEnum,
});

/**
 * Session Agenda Item schema (from session_agenda_item table)
 */
export const SessionAgendaItemSchema = z.object({
	id: z.string().uuid(),
	sessionId: z.string().uuid(),
	orderIndex: z.coerce.number(), // Decimal in DB, coerce to number for frontend
	contentText: z.string().nullable(),
	linkedDocument: z.string().uuid().nullable(),
	attachmentPath: z.string().nullable(),
	attachmentName: z.string().nullable(),
	section: SessionSectionEnum,
});

/**
 * Session with agenda items (for detail view)
 */
export const SessionWithAgendaSchema = SessionSchema.extend({
	agendaItems: z.array(SessionAgendaItemSchema),
});

/**
 * Sort direction enum
 */
export const SortDirectionEnum = z.enum(["asc", "desc"]);

/**
 * Public session status enum (only scheduled and completed allowed for public portal)
 */
export const PublicSessionStatusEnum = z.enum(["scheduled", "completed"]);

/**
 * Admin session status enum (includes draft for admin access)
 */
export const AdminSessionStatusEnum = z.enum([
	"draft",
	"scheduled",
	"completed",
]);

/**
 * Get session list input with filtering and sorting (PUBLIC)
 */
export const GetSessionListSchema = z.object({
	type: z.union([SessionTypeEnum, z.array(SessionTypeEnum).min(1)]).optional(),
	status: z
		.union([PublicSessionStatusEnum, z.array(PublicSessionStatusEnum).min(1)])
		.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	sortBy: z.enum(["date"]).default("date"),
	sortDirection: SortDirectionEnum.default("desc"),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	page: z.coerce.number().int().min(1).default(1), // Page number for offset pagination
});

/**
 * Get session list input with filtering and sorting (ADMIN - includes draft)
 */
export const GetSessionListAdminSchema = z.object({
	type: z.union([SessionTypeEnum, z.array(SessionTypeEnum).min(1)]).optional(),
	status: z
		.union([AdminSessionStatusEnum, z.array(AdminSessionStatusEnum).min(1)])
		.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	sortBy: z.enum(["date"]).default("date"),
	sortDirection: SortDirectionEnum.default("desc"),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	page: z.coerce.number().int().min(1).default(1), // Page number for offset pagination
});

/**
 * Get session by ID input
 */
export const GetSessionByIdSchema = z.object({
	id: z.string().uuid(),
});

/**
 * Pagination info for offset pagination
 */
export const SessionPaginationInfoSchema = z.object({
	currentPage: z.number().int().min(1),
	totalPages: z.number().int().min(0),
	totalCount: z.number().int().min(0),
	itemsPerPage: z.number().int().min(1),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
});

/**
 * Session list response
 */
export const SessionListResponseSchema = z.object({
	sessions: z.array(SessionSchema),
	pagination: SessionPaginationInfoSchema,
});

// Types
// Note: SessionType, SessionStatus, SessionSection are already exported from enums/session.ts
export type Session = z.infer<typeof SessionSchema>;
export type SessionAgendaItem = z.infer<typeof SessionAgendaItemSchema>;
export type SessionWithAgenda = z.infer<typeof SessionWithAgendaSchema>;
export type SortDirection = z.infer<typeof SortDirectionEnum>;
export type GetSessionListInput = z.infer<typeof GetSessionListSchema>;
export type GetSessionListAdminInput = z.infer<
	typeof GetSessionListAdminSchema
>;
export type GetSessionByIdInput = z.infer<typeof GetSessionByIdSchema>;
export type SessionPaginationInfo = z.infer<typeof SessionPaginationInfoSchema>;
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;
