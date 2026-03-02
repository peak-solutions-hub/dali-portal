import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	DocumentFileUrlResponseSchema,
	GetDocumentFileUrlSchema,
} from "../schemas/document-version.schema";
import {
	AdminSessionListResponseSchema,
	AdminSessionResponseSchema,
	AdminSessionWithAgendaSchema,
	AgendaPdfUrlResponseSchema,
	AgendaUploadUrlResponseSchema,
	ApprovedDocumentListResponseSchema,
	CreateSessionSchema,
	DeleteSessionSchema,
	GetAgendaPdfUrlSchema,
	GetAgendaUploadUrlSchema,
	GetPublicDocumentFileUrlSchema,
	GetSessionByIdSchema,
	GetSessionListAdminSchema,
	GetSessionListSchema,
	MarkSessionCompleteSchema,
	PublicDocumentFileUrlResponseSchema,
	PublishSessionSchema,
	RemoveAgendaItemSchema,
	RemoveAgendaPdfSchema,
	SaveAgendaPdfSchema,
	SaveSessionDraftSchema,
	SessionListResponseSchema,
	SessionWithAgendaSchema,
	UnpublishSessionSchema,
} from "../schemas/session.schema";

/* ============================
   Public Endpoints
   ============================ */

/**
 * List sessions endpoint (Public)
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
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		LOAD_FAILED: ERRORS.SESSION.LOAD_FAILED,
	})
	.input(GetSessionListSchema)
	.output(SessionListResponseSchema);

/**
 * Get session by ID endpoint (Public)
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
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		LOAD_FAILED: ERRORS.SESSION.LOAD_FAILED,
	})
	.input(GetSessionByIdSchema)
	.output(SessionWithAgendaSchema);

/**
 * Get agenda PDF signed URL (Public)
 */
export const getAgendaPdfUrl = oc
	.route({
		method: "GET",
		path: "/sessions/{id}/agenda-pdf-url",
		summary: "Get agenda PDF URL",
		description:
			"Public endpoint to get a signed URL for viewing/downloading the session agenda PDF.",
		tags: ["Sessions", "Public"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		SIGNED_URL_FAILED: ERRORS.STORAGE.SIGNED_URL_FAILED,
	})
	.input(GetAgendaPdfUrlSchema)
	.output(AgendaPdfUrlResponseSchema);

/**
 * Get a document file URL (Public)
 * Only serves documents with status='approved' AND purpose='for_agenda' that
 * are linked to an agenda item on a scheduled or completed session.
 * Prevents leaking internal draft or unlinked documents.
 */
export const getPublicDocumentFileUrl = oc
	.route({
		method: "GET",
		path: "/sessions/documents/{documentId}/file-url",
		summary: "Get public document file URL",
		description:
			"Public endpoint to get a signed URL for a legislative document file. " +
			"Only returns files for documents with status='approved' AND purpose='for_agenda' " +
			"that are linked to at least one agenda item on a scheduled or completed session.",
		tags: ["Sessions", "Public"],
	})
	.errors({
		NOT_FOUND: ERRORS.GENERAL.NOT_FOUND,
		SIGNED_URL_FAILED: ERRORS.STORAGE.SIGNED_URL_FAILED,
	})
	.input(GetPublicDocumentFileUrlSchema)
	.output(PublicDocumentFileUrlResponseSchema);

/* ============================
   Admin Endpoints
   ============================ */

/**
 * List sessions (Admin - includes drafts)
 */
export const adminListSessions = oc
	.route({
		method: "GET",
		path: "/admin/sessions",
		summary: "List sessions (admin)",
		description:
			"Admin endpoint to list all sessions including drafts with filtering and sorting.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		LOAD_FAILED: ERRORS.SESSION.LOAD_FAILED,
	})
	.input(GetSessionListAdminSchema)
	.output(AdminSessionListResponseSchema);

/**
 * Get session by ID (Admin - includes draft details)
 */
export const adminGetSessionById = oc
	.route({
		method: "GET",
		path: "/admin/sessions/{id}",
		summary: "Get session by ID (admin)",
		description:
			"Admin endpoint to get session details including draft sessions.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		LOAD_FAILED: ERRORS.SESSION.LOAD_FAILED,
	})
	.input(GetSessionByIdSchema)
	.output(AdminSessionWithAgendaSchema);

/**
 * Create a new session (Admin)
 */
export const createSession = oc
	.route({
		method: "POST",
		path: "/admin/sessions",
		summary: "Create a new session",
		description: "Admin endpoint to create a new draft session.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		DUPLICATE_DATE: ERRORS.SESSION.DUPLICATE_DATE,
		CREATION_FAILED: ERRORS.SESSION.CREATION_FAILED,
	})
	.input(CreateSessionSchema)
	.output(AdminSessionResponseSchema);

/**
 * Save session draft (agenda items)
 */
export const saveSessionDraft = oc
	.route({
		method: "PATCH",
		path: "/admin/sessions/{id}/draft",
		summary: "Save session draft",
		description: "Admin endpoint to save agenda items for a draft session.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		NOT_DRAFT: ERRORS.SESSION.NOT_DRAFT,
		SAVE_FAILED: ERRORS.SESSION.SAVE_FAILED,
	})
	.input(SaveSessionDraftSchema)
	.output(AdminSessionWithAgendaSchema);

/**
 * Publish session (set status to scheduled)
 */
export const publishSession = oc
	.route({
		method: "PATCH",
		path: "/admin/sessions/{id}/publish",
		summary: "Publish session",
		description:
			"Admin endpoint to change session status from draft to scheduled (published).",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		NOT_DRAFT: ERRORS.SESSION.NOT_DRAFT,
		PUBLISH_FAILED: ERRORS.SESSION.PUBLISH_FAILED,
	})
	.input(PublishSessionSchema)
	.output(AdminSessionResponseSchema);

/**
 * Unpublish session (revert from scheduled to draft)
 */
export const unpublishSession = oc
	.route({
		method: "PATCH",
		path: "/admin/sessions/{id}/unpublish",
		summary: "Unpublish session",
		description:
			"Admin endpoint to revert a scheduled session back to draft status.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		NOT_SCHEDULED: ERRORS.SESSION.NOT_SCHEDULED,
		UNPUBLISH_FAILED: ERRORS.SESSION.UNPUBLISH_FAILED,
	})
	.input(UnpublishSessionSchema)
	.output(AdminSessionResponseSchema);

/**
 * Mark session as completed
 */
export const markSessionComplete = oc
	.route({
		method: "PATCH",
		path: "/admin/sessions/{id}/complete",
		summary: "Mark session as completed",
		description: "Admin endpoint to mark a scheduled session as completed.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		NOT_SCHEDULED: ERRORS.SESSION.NOT_SCHEDULED,
		COMPLETE_FAILED: ERRORS.SESSION.COMPLETE_FAILED,
	})
	.input(MarkSessionCompleteSchema)
	.output(AdminSessionResponseSchema);

/**
 * Delete session (draft only)
 */
export const deleteSession = oc
	.route({
		method: "DELETE",
		path: "/admin/sessions/{id}",
		summary: "Delete session",
		description: "Admin endpoint to delete a draft session.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		DELETE_NOT_DRAFT: ERRORS.SESSION.DELETE_NOT_DRAFT,
		DELETE_FAILED: ERRORS.SESSION.DELETE_FAILED,
	})
	.input(DeleteSessionSchema)
	.output(AdminSessionResponseSchema);

/**
 * List approved documents for linking to agenda items
 */
export const listApprovedDocuments = oc
	.route({
		method: "GET",
		path: "/admin/sessions/documents",
		summary: "List approved documents",
		description:
			"Admin endpoint to list approved documents that can be linked to session agenda items.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		LOAD_FAILED: ERRORS.SESSION.LOAD_FAILED,
	})
	.output(ApprovedDocumentListResponseSchema);

/**
 * Get a signed URL for viewing a document file
 */
export const getDocumentFileUrl = oc
	.route({
		method: "GET",
		path: "/admin/sessions/documents/{documentId}/file-url",
		summary: "Get document file URL",
		description:
			"Admin endpoint to get a signed URL for viewing/downloading a document file from storage.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.GENERAL.NOT_FOUND,
		SIGNED_URL_FAILED: ERRORS.STORAGE.SIGNED_URL_FAILED,
	})
	.input(GetDocumentFileUrlSchema)
	.output(DocumentFileUrlResponseSchema);

/**
 * Get a signed upload URL for session agenda PDF
 */
export const getAgendaUploadUrl = oc
	.route({
		method: "POST",
		path: "/admin/sessions/{id}/agenda-upload-url",
		summary: "Get agenda PDF upload URL",
		description:
			"Admin endpoint to get a signed upload URL for uploading session agenda PDF.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		NOT_SCHEDULED: ERRORS.SESSION.NOT_SCHEDULED,
		SIGNED_URL_FAILED: ERRORS.STORAGE.SIGNED_URL_FAILED,
	})
	.input(GetAgendaUploadUrlSchema)
	.output(AgendaUploadUrlResponseSchema);

/**
 * Save agenda PDF path after successful upload
 */
export const saveAgendaPdf = oc
	.route({
		method: "PATCH",
		path: "/admin/sessions/{id}/agenda-pdf",
		summary: "Save agenda PDF",
		description:
			"Admin endpoint to save the agenda PDF file path after upload and create a tracking agenda item.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		NOT_SCHEDULED: ERRORS.SESSION.NOT_SCHEDULED,
		AGENDA_SAVE_FAILED: ERRORS.SESSION.AGENDA_SAVE_FAILED,
	})
	.input(SaveAgendaPdfSchema)
	.output(AdminSessionResponseSchema);

/**
 * Remove agenda PDF from session
 */
export const removeAgendaPdf = oc
	.route({
		method: "DELETE",
		path: "/admin/sessions/{id}/agenda-pdf",
		summary: "Remove agenda PDF",
		description:
			"Admin endpoint to remove the agenda PDF from a scheduled session.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		NOT_SCHEDULED: ERRORS.SESSION.NOT_SCHEDULED,
		AGENDA_DELETE_FAILED: ERRORS.SESSION.AGENDA_DELETE_FAILED,
	})
	.input(RemoveAgendaPdfSchema)
	.output(AdminSessionResponseSchema);

/**
 * Remove a single agenda item from a scheduled session
 * Only allowed when session status is scheduled (not draft, not completed)
 */
export const removeAgendaItem = oc
	.route({
		method: "DELETE",
		path: "/admin/sessions/{sessionId}/agenda-items/{agendaItemId}",
		summary: "Remove agenda item",
		description:
			"Admin endpoint to remove a single agenda item from a scheduled session. " +
			"Only permitted when the session status is scheduled.",
		tags: ["Sessions", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.SESSION.NOT_FOUND,
		NOT_SCHEDULED: ERRORS.SESSION.NOT_SCHEDULED,
		REMOVE_ITEM_FAILED: ERRORS.SESSION.REMOVE_ITEM_FAILED,
	})
	.input(RemoveAgendaItemSchema)
	.output(AdminSessionWithAgendaSchema);

/**
 * Session contract (exported for root router)
 */
export const sessionContract = {
	// Public
	list: listSessions,
	getById: getSessionById,
	getAgendaPdfUrl: getAgendaPdfUrl,
	getPublicDocumentFileUrl: getPublicDocumentFileUrl,
	// Admin
	adminList: adminListSessions,
	adminGetById: adminGetSessionById,
	create: createSession,
	saveDraft: saveSessionDraft,
	publish: publishSession,
	unpublish: unpublishSession,
	markComplete: markSessionComplete,
	delete: deleteSession,
	approvedDocuments: listApprovedDocuments,
	getDocumentFileUrl: getDocumentFileUrl,
	getAgendaUploadUrl: getAgendaUploadUrl,
	saveAgendaPdf: saveAgendaPdf,
	removeAgendaPdf: removeAgendaPdf,
	removeAgendaItem: removeAgendaItem,
};
