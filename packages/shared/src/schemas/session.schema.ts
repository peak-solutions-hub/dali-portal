import { z } from "zod";
import {
	SESSION_ITEMS_PER_PAGE,
	SESSION_MAX_ITEMS_PER_PAGE,
	SESSION_MIN_ITEMS_PER_PAGE,
} from "../constants/session-rules";
import {
	SESSION_SECTION_VALUES,
	SESSION_STATUS_VALUES,
	SESSION_TYPE_VALUES,
} from "../enums/session";
import {
	ClassificationTypeEnum,
	DocumentTypeEnum,
	PurposeTypeEnum,
	StatusTypeEnum,
} from "./document.schema";

/* ============================
   Shared Base Schemas
   ============================ */

export const SessionTypeEnum = z.enum(
	SESSION_TYPE_VALUES as [string, ...string[]],
);

export const SessionStatusEnum = z.enum(
	SESSION_STATUS_VALUES as [string, ...string[]],
);

export const SessionSectionEnum = z.enum(
	SESSION_SECTION_VALUES as [string, ...string[]],
);

export const SortDirectionEnum = z.enum(["asc", "desc"]);

export const SessionSchema = z.object({
	id: z.string().uuid(),
	sessionNumber: z.coerce.number().int(),
	scheduleDate: z.coerce.date(),
	agendaFilePath: z.string().nullable(),
	type: SessionTypeEnum,
	status: SessionStatusEnum,
});

export const SessionAgendaItemSchema = z.object({
	id: z.string().uuid(),
	sessionId: z.string().uuid(),
	orderIndex: z.coerce.number(),
	contentText: z.string().nullable(),
	linkedDocument: z.string().uuid().nullable(),
	attachmentPath: z.string().nullable(),
	attachmentName: z.string().nullable(),
	section: SessionSectionEnum,
	isCustomText: z.boolean().nullable().optional(),
	classification: z.string().nullable().optional(),
});

/**
 * Linked document summary — embedded in agenda items for public/admin detail views.
 */
export const LinkedDocumentSchema = z.object({
	id: z.string().uuid(),
	codeNumber: z.string(),
	title: z.string(),
	type: DocumentTypeEnum,
	status: StatusTypeEnum,
	purpose: PurposeTypeEnum,
	classification: ClassificationTypeEnum.nullable().optional(),
	receivedAt: z.string().optional(),
	authors: z.array(z.string()).optional(),
	sponsors: z.array(z.string()).optional(),
});

/**
 * Agenda document — lightweight document reference used in agenda item UI components.
 * Consolidates the former AgendaDocument and AttachedDocument interfaces (they were identical).
 */
export const AgendaDocumentSchema = z.object({
	id: z.string(),
	codeNumber: z.string(),
	title: z.string(),
	summary: z.string().optional(),
	classification: z.string().optional(),
	orderIndex: z.number().optional(),
	/** DB row ID of the SessionAgendaItem that links this document.
	 *  Populated on load so scheduled-session remove can call the
	 *  removeAgendaItem endpoint with the correct row ID. */
	agendaItemId: z.string().optional(),
});

export const SessionAgendaItemWithDocumentSchema =
	SessionAgendaItemSchema.extend({
		document: LinkedDocumentSchema.nullable(),
	});

export const SessionWithAgendaSchema = SessionSchema.extend({
	agendaItems: z.array(SessionAgendaItemWithDocumentSchema),
});

export const SessionPaginationInfoSchema = z.object({
	currentPage: z.number().int().min(1),
	totalPages: z.number().int().min(0),
	totalCount: z.number().int().min(0),
	itemsPerPage: z.number().int().min(1),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
});

export const SessionListResponseSchema = z.object({
	sessions: z.array(SessionSchema),
	pagination: SessionPaginationInfoSchema,
});

export const GetSessionByIdSchema = z.object({
	id: z.string().uuid(),
});

/* ============================
   Portal (Public) Schemas
   ============================ */

export const PublicSessionStatusEnum = z.enum(["scheduled", "completed"]);

export const GetSessionListSchema = z.object({
	type: z.union([SessionTypeEnum, z.array(SessionTypeEnum).min(1)]).optional(),
	status: z
		.union([PublicSessionStatusEnum, z.array(PublicSessionStatusEnum).min(1)])
		.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	sortBy: z.enum(["date"]).default("date"),
	sortDirection: SortDirectionEnum.default("desc"),
	limit: z.coerce
		.number()
		.int()
		.min(SESSION_MIN_ITEMS_PER_PAGE)
		.max(SESSION_MAX_ITEMS_PER_PAGE)
		.default(SESSION_ITEMS_PER_PAGE),
	page: z.coerce.number().int().min(1).default(1),
});

/* ============================
   Portal (Public) Types
   ============================ */

export type Session = z.infer<typeof SessionSchema>;
export type SessionAgendaItem = z.infer<typeof SessionAgendaItemSchema>;
export type LinkedDocument = z.infer<typeof LinkedDocumentSchema>;
export type AgendaDocument = z.infer<typeof AgendaDocumentSchema>;
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

export const AdminSessionStatusEnum = SessionStatusEnum;

export const GetSessionListAdminSchema = z.object({
	type: z.union([SessionTypeEnum, z.array(SessionTypeEnum).min(1)]).optional(),
	status: z
		.union([AdminSessionStatusEnum, z.array(AdminSessionStatusEnum).min(1)])
		.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	sortBy: z.enum(["date"]).default("date"),
	sortDirection: SortDirectionEnum.default("desc"),
	limit: z.coerce
		.number()
		.int()
		.min(SESSION_MIN_ITEMS_PER_PAGE)
		.max(SESSION_MAX_ITEMS_PER_PAGE)
		.default(SESSION_ITEMS_PER_PAGE),
	page: z.coerce.number().int().min(1).default(1),
});

export const SessionManagementAgendaItemSchema = z.object({
	id: z.string(),
	title: z.string(),
	section: SessionSectionEnum,
	orderIndex: z.number(),
	documentId: z.string().optional(),
	description: z.string().optional(),
});

export const SessionManagementDocumentSchema = z.object({
	id: z.string(),
	title: z.string(),
	type: DocumentTypeEnum,
	number: z.string(),
	classification: ClassificationTypeEnum,
	status: StatusTypeEnum,
	purpose: PurposeTypeEnum,
	receivedAt: z.string(),
	authors: z.array(z.string()),
	sponsors: z.array(z.string()),
});

export const SessionManagementSessionSchema = z.object({
	id: z.string(),
	sessionNumber: z.coerce.number().int(),
	date: z.string(),
	time: z.string(),
	type: SessionTypeEnum,
	status: SessionStatusEnum,
	agendaFilePath: z.string().nullable().optional(),
});

/* ============================
   Agenda Builder Schemas
   ============================ */

/** A free-text agenda item authored directly in the builder (not linked to a document). */
export const CustomTextItemSchema = z.object({
	id: z.string(),
	content: z.string(),
	classification: z.string().optional(),
	orderIndex: z.number(),
});

/** A single agenda item as submitted from the agenda builder to the API. */
export const BuildAgendaItemSchema = z.object({
	section: SessionSectionEnum,
	orderIndex: z.number(),
	contentText: z.string().nullable().optional(),
	linkedDocument: z.string().nullable().optional(),
	classification: z.string().nullable().optional(),
	isCustomText: z.boolean().optional(),
});

/* ============================
   Admin CRUD Schemas
   ============================ */

export const CreateSessionSchema = z.object({
	scheduleDate: z.coerce.date(),
	type: SessionTypeEnum,
});

export const AdminAgendaItemInputSchema = z.object({
	section: SessionSectionEnum,
	orderIndex: z.number().int().min(0),
	contentText: z.string().nullable().optional(),
	linkedDocument: z.string().uuid().nullable().optional(),
	attachmentPath: z.string().nullable().optional(),
	attachmentName: z.string().nullable().optional(),
	isCustomText: z.boolean().optional(),
	classification: z.string().nullable().optional(),
});

export const SaveSessionDraftSchema = z.object({
	id: z.string().uuid(),
	agendaItems: z.array(AdminAgendaItemInputSchema),
});

export const PublishSessionSchema = z.object({
	id: z.string().uuid(),
});

export const UnpublishSessionSchema = z.object({
	id: z.string().uuid(),
});

export const MarkSessionCompleteSchema = z.object({
	id: z.string().uuid(),
});

export const DeleteSessionSchema = z.object({
	id: z.string().uuid(),
});

export const AdminSessionResponseSchema = SessionSchema;

export const AdminSessionWithAgendaSchema = SessionSchema.extend({
	agendaItems: z.array(SessionAgendaItemWithDocumentSchema),
});

export const AdminSessionListResponseSchema = z.object({
	sessions: z.array(SessionSchema),
	pagination: SessionPaginationInfoSchema,
});

/** Agenda-source document for session agenda linking — same shape as SessionManagementDocumentSchema. */
export const ApprovedDocumentSchema = SessionManagementDocumentSchema;

export const ApprovedDocumentListResponseSchema = z.object({
	documents: z.array(ApprovedDocumentSchema),
});

export const GetAgendaUploadUrlSchema = z.object({
	id: z.string().uuid(),
	fileName: z.string().min(1),
});

export const AgendaUploadUrlResponseSchema = z.object({
	signedUrl: z.string(),
	token: z.string(),
	path: z.string(),
});

export const SaveAgendaPdfSchema = z.object({
	id: z.string().uuid(),
	filePath: z.string().min(1),
	fileName: z.string().min(1),
});

export const RemoveAgendaPdfSchema = z.object({
	id: z.string().uuid(),
});

export const RemoveAgendaItemSchema = z.object({
	sessionId: z.string().uuid(),
	agendaItemId: z.string().uuid(),
});

export const GetAgendaPdfUrlSchema = z.object({
	id: z.string().uuid(),
});

export const GetPublicDocumentFileUrlSchema = z.object({
	sessionId: z.string().uuid(),
	documentId: z.string().uuid(),
});

export const AgendaPdfUrlResponseSchema = z.object({
	signedUrl: z.string(),
	fileName: z.string(),
});

export const PublicDocumentFileUrlResponseSchema = z.object({
	signedUrl: z.string(),
	fileName: z.string(),
	contentType: z.string().optional(),
});

/* ============================
   Admin Types
   ============================ */

export type GetSessionListAdminInput = z.infer<
	typeof GetSessionListAdminSchema
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

export type CustomTextItem = z.infer<typeof CustomTextItemSchema>;
export type BuildAgendaItem = z.infer<typeof BuildAgendaItemSchema>;

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
export type GetAgendaUploadUrlInput = z.infer<typeof GetAgendaUploadUrlSchema>;
export type AgendaUploadUrlResponse = z.infer<
	typeof AgendaUploadUrlResponseSchema
>;
export type SaveAgendaPdfInput = z.infer<typeof SaveAgendaPdfSchema>;
export type RemoveAgendaPdfInput = z.infer<typeof RemoveAgendaPdfSchema>;
export type RemoveAgendaItemInput = z.infer<typeof RemoveAgendaItemSchema>;
export type GetAgendaPdfUrlInput = z.infer<typeof GetAgendaPdfUrlSchema>;
export type AgendaPdfUrlResponse = z.infer<typeof AgendaPdfUrlResponseSchema>;
export type PublicDocumentFileUrlResponse = z.infer<
	typeof PublicDocumentFileUrlResponseSchema
>;
export type GetPublicDocumentFileUrlInput = z.infer<
	typeof GetPublicDocumentFileUrlSchema
>;
