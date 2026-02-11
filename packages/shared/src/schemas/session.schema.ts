import { z } from "zod";
import {
	SESSION_SECTION_VALUES,
	SESSION_STATUS_VALUES,
	SESSION_TYPE_VALUES,
} from "../enums/session";

/* ============================
   Shared Base Schemas
   ============================ */

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
 * Sort direction enum
 */
export const SortDirectionEnum = z.enum(["asc", "desc"]);

/**
 * Session schema (from session table)
 */
export const SessionSchema = z.object({
	id: z.string().uuid(),
	sessionNumber: z.coerce.number().int(), // Decimal in DB, coerce to number for frontend
	scheduleDate: z.coerce.date(),
	agendaFilePath: z.string().nullable(),
	type: SessionTypeEnum,
	status: z.enum(["draft", "scheduled", "completed"]),
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
 * Linked document summary (embedded in agenda items for public/admin detail views)
 */
export const LinkedDocumentSchema = z.object({
	id: z.string().uuid(),
	codeNumber: z.string(),
	title: z.string(),
	type: z.string(),
	status: z.string(),
	purpose: z.string(),
	classification: z.string().nullable().optional(),
	receivedAt: z.string().optional(),
	authors: z.array(z.string()).optional(),
	sponsors: z.array(z.string()).optional(),
});

/**
 * Session Agenda Item with nested document data
 */
export const SessionAgendaItemWithDocumentSchema =
	SessionAgendaItemSchema.extend({
		document: LinkedDocumentSchema.nullable(),
	});

/**
 * Session with agenda items (for detail view)
 */
export const SessionWithAgendaSchema = SessionSchema.extend({
	agendaItems: z.array(SessionAgendaItemWithDocumentSchema),
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

/**
 * Get session by ID input
 */
export const GetSessionByIdSchema = z.object({
	id: z.string().uuid(),
});

/* ============================
   Portal (Public) Schemas
   ============================ */

/**
 * Public session status enum (only scheduled and completed allowed for public portal)
 */
export const PublicSessionStatusEnum = z.enum(["scheduled", "completed"]);

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

/* ============================
   Portal (Public) Types
   ============================ */

export type Session = z.infer<typeof SessionSchema>;
export type SessionAgendaItem = z.infer<typeof SessionAgendaItemSchema>;
export type LinkedDocument = z.infer<typeof LinkedDocumentSchema>;
export type SessionAgendaItemWithDocument = z.infer<
	typeof SessionAgendaItemWithDocumentSchema
>;
export type SessionWithAgenda = z.infer<typeof SessionWithAgendaSchema>;
export type SortDirection = z.infer<typeof SortDirectionEnum>;
export type GetSessionListInput = z.infer<typeof GetSessionListSchema>;
export type GetSessionByIdInput = z.infer<typeof GetSessionByIdSchema>;
export type SessionPaginationInfo = z.infer<typeof SessionPaginationInfoSchema>;
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;

/* ============================
   Admin Schemas
   ============================ */

/**
 * Admin session status enum (includes draft for admin access)
 */
export const AdminSessionStatusEnum = z.enum([
	"draft",
	"scheduled",
	"completed",
]);

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
 * Session presentation slide document schema (ADMIN)
 */
export const SessionPresentationSlideDocumentSchema = z.object({
	key: z.string(),
	title: z.string(),
});

/**
 * Session presentation slide schema (ADMIN)
 */
export const SessionPresentationSlideSchema = z.object({
	id: z.string(),
	type: z.enum(["cover", "agenda-item"]),
	title: z.string(),
	subtitle: z.string().optional(),
	agendaNumber: z.string().optional(),
	section: SessionSectionEnum.optional(),
	documents: z.array(SessionPresentationSlideDocumentSchema).optional(),
});

/**
 * Session Management Agenda Item schema (ADMIN UI)
 */
export const SessionManagementAgendaItemSchema = z.object({
	id: z.string(),
	title: z.string(),
	section: SessionSectionEnum,
	orderIndex: z.number(),
	documentId: z.string().optional(),
	description: z.string().optional(),
});

/**
 * Session Management Document schema (ADMIN UI)
 */
export const SessionManagementDocumentSchema = z.object({
	id: z.string(),
	title: z.string(),
	type: z.string(),
	number: z.string(),
	classification: z.string(),
	status: z.string(),
	purpose: z.string(),
	receivedAt: z.string(),
	authors: z.array(z.string()),
	sponsors: z.array(z.string()),
});

/**
 * Session Management Session schema (ADMIN UI)
 */
export const SessionManagementSessionSchema = z.object({
	id: z.string(),
	sessionNumber: z.coerce.number().int(),
	date: z.string(),
	time: z.string(),
	type: z.enum(["regular", "special"]),
	status: z.enum(["draft", "scheduled", "completed"]),
});

/* ============================
   Admin CRUD Schemas
   ============================ */

/**
 * Create session input schema
 */
export const CreateSessionSchema = z.object({
	scheduleDate: z.coerce.date(),
	type: SessionTypeEnum,
});

/**
 * Admin session agenda item input (for saving agenda items with session)
 */
export const AdminAgendaItemInputSchema = z.object({
	section: SessionSectionEnum,
	orderIndex: z.number().int().min(0),
	contentText: z.string().nullable().optional(),
	linkedDocument: z.string().uuid().nullable().optional(),
	attachmentPath: z.string().nullable().optional(),
	attachmentName: z.string().nullable().optional(),
});

/**
 * Save session draft input
 */
export const SaveSessionDraftSchema = z.object({
	id: z.string().uuid(),
	agendaItems: z.array(AdminAgendaItemInputSchema),
});

/**
 * Publish session (set to scheduled)
 */
export const PublishSessionSchema = z.object({
	id: z.string().uuid(),
});

/**
 * Unpublish session (revert to draft)
 */
export const UnpublishSessionSchema = z.object({
	id: z.string().uuid(),
});

/**
 * Mark session as completed
 */
export const MarkSessionCompleteSchema = z.object({
	id: z.string().uuid(),
});

/**
 * Delete session (draft only)
 */
export const DeleteSessionSchema = z.object({
	id: z.string().uuid(),
});

/**
 * Admin session response (returned from create/update)
 */
export const AdminSessionResponseSchema = SessionSchema;

/**
 * Admin session with agenda items
 */
export const AdminSessionWithAgendaSchema = SessionSchema.extend({
	agendaItems: z.array(SessionAgendaItemWithDocumentSchema),
});

/**
 * Admin session list response
 */
export const AdminSessionListResponseSchema = z.object({
	sessions: z.array(SessionSchema),
	pagination: SessionPaginationInfoSchema,
});

/**
 * Approved document for session agenda linking
 * Same shape as SessionManagementDocumentSchema
 */
export const ApprovedDocumentSchema = SessionManagementDocumentSchema;

/**
 * Approved documents list response
 */
export const ApprovedDocumentListResponseSchema = z.object({
	documents: z.array(ApprovedDocumentSchema),
});

/* ============================
   Admin Types
   ============================ */

export type GetSessionListAdminInput = z.infer<
	typeof GetSessionListAdminSchema
>;
export type SessionPresentationSlideDocument = z.infer<
	typeof SessionPresentationSlideDocumentSchema
>;
export type SessionPresentationSlide = z.infer<
	typeof SessionPresentationSlideSchema
>;
export type SessionManagementAgendaItem = z.infer<
	typeof SessionManagementAgendaItemSchema
>;
export type SessionManagementDocument = z.infer<
	typeof SessionManagementDocumentSchema
>;
export type SessionManagementSession = z.infer<
	typeof SessionManagementSessionSchema
>;

/* Admin CRUD types */
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type AdminAgendaItemInput = z.infer<typeof AdminAgendaItemInputSchema>;
export type SaveSessionDraftInput = z.infer<typeof SaveSessionDraftSchema>;
export type PublishSessionInput = z.infer<typeof PublishSessionSchema>;
export type UnpublishSessionInput = z.infer<typeof UnpublishSessionSchema>;
export type MarkSessionCompleteInput = z.infer<
	typeof MarkSessionCompleteSchema
>;
export type DeleteSessionInput = z.infer<typeof DeleteSessionSchema>;
export type AdminSessionResponse = z.infer<typeof AdminSessionResponseSchema>;
export type AdminSessionWithAgenda = z.infer<
	typeof AdminSessionWithAgendaSchema
>;
export type AdminSessionListResponse = z.infer<
	typeof AdminSessionListResponseSchema
>;
export type ApprovedDocument = z.infer<typeof ApprovedDocumentSchema>;
export type ApprovedDocumentListResponse = z.infer<
	typeof ApprovedDocumentListResponseSchema
>;

/* ============================
   Admin UI Component Props
   ============================ */

/**
 * These prop types are kept in the schema file to maintain type safety
 * and ensure consistency between the schema definitions and component interfaces.
 * They provide compile-time type checking for session management components.
 */

export type SessionManagementAgendaPanelProps = {
	selectedSession: SessionManagementSession | null;
	agendaItems: SessionManagementAgendaItem[];
	onAddDocument: (itemId: string) => void;
	onSaveDraft: () => void;
	onPublish: () => void;
	onMarkComplete?: () => void;
};

export type SessionManagementDocumentsPanelProps = {
	documents: SessionManagementDocument[];
};
