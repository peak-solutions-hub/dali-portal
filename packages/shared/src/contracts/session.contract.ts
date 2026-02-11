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
	ApprovedDocumentListResponseSchema,
	CreateSessionSchema,
	DeleteSessionSchema,
	GetSessionByIdSchema,
	GetSessionListAdminSchema,
	GetSessionListSchema,
	MarkSessionCompleteSchema,
	PublishSessionSchema,
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
	})
	.input(GetSessionByIdSchema)
	.output(SessionWithAgendaSchema);

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
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		CONFLICT: ERRORS.GENERAL.CONFLICT,
		CREATION_FAILED: ERRORS.SESSION.CREATION_FAILED,
		DUPLICATE_DATE: ERRORS.SESSION.DUPLICATE_DATE,
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
	})
	.input(GetDocumentFileUrlSchema)
	.output(DocumentFileUrlResponseSchema);

/**
 * Session contract (exported for root router)
 */
export const sessionContract = {
	// Public
	list: listSessions,
	getById: getSessionById,
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
};
