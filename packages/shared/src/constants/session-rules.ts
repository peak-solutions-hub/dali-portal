/**
 * @fileoverview Session Configuration Constants and Workflow Rules
 *
 * This file defines the core configuration and business logic for session management:
 * 1. Pagination limits for session listings
 * 2. Storage bucket names for session files
 * 3. Session Status workflow and transitions
 * 4. Public file access rules
 * 5. Default values and constraints
 *
 * These constants are used by:
 * - Frontend: To configure pagination and file handling
 * - Backend: To validate inputs, manage storage, and enforce workflow
 * - Shared: To ensure UI and API agree on constraints
 */

import { SessionStatus } from "../enums/session";

// =============================================================================
// PAGINATION CONFIGURATION
// =============================================================================

/**
 * Default number of sessions to display per page
 * Used in GetSessionListSchema and GetSessionListAdminSchema
 */
export const SESSION_ITEMS_PER_PAGE = 10;

/**
 * Maximum number of sessions that can be requested in a single query
 */
export const SESSION_MAX_ITEMS_PER_PAGE = 100;

/**
 * Minimum number of sessions that can be requested
 */
export const SESSION_MIN_ITEMS_PER_PAGE = 1;

/**
 * Session number format uses `YYxxx`.
 * - `YY`: last 2 digits of the schedule year (PHT)
 * - `xxx`: 3-digit sequence within that year
 */
export const SESSION_NUMBER_YEAR_MODULO = 100;
export const SESSION_NUMBER_SEQUENCE_BASE = 1000;
export const SESSION_NUMBER_MIN_SEQUENCE = 1;

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

/**
 * Supabase storage bucket for session agenda PDF files.
 * Used by agenda PDF upload/download and signed URL generation.
 */
export const SESSION_AGENDA_BUCKET = "agendas";

/**
 * Supabase storage bucket for legislative document file attachments.
 * Used by agenda item file URL and public document file URL handlers.
 */
export const SESSION_DOCUMENTS_BUCKET = "documents";

// =============================================================================
// FILE URL CONFIGURATION
// =============================================================================

/**
 * Default expiration time for signed URLs (in seconds).
 * 3600 seconds = 1 hour
 */
export const DEFAULT_SIGNED_URL_EXPIRY = 3600;

/**
 * Extended expiration time for session files that need longer access (in seconds).
 * 7200 seconds = 2 hours
 */
export const EXTENDED_SIGNED_URL_EXPIRY = 7200;

// =============================================================================
// SESSION STATUS WORKFLOW
// =============================================================================

/**
 * Session status workflow transitions.
 *
 * Workflow Summary:
 *
 * DRAFT (Admin creates session with agenda builder):
 *   - Admin creates new session in "draft" status
 *   - Admin builds agenda by adding:
 *     * Approved documents from the Document Tracker (status 'approved',
 *       purpose 'for_agenda')
 *     * Custom agenda items (Prayer, Roll Call, etc.)
 *   - Admin can reorder, edit, or delete agenda items
 *   - Session is not visible to the public
 *
 * DRAFT → SCHEDULED (Admin finalizes session):
 *   - Admin reviews and finalizes the agenda
 *   - Session status transitions to "scheduled"
 *   - Session and its agenda become publicly visible
 *   - Linked documents and their attachments are publicly accessible
 *   - Agenda is locked — no further changes allowed
 *
 * SCHEDULED → COMPLETED (After session concludes):
 *   - Admin marks session as completed after it takes place
 *   - Session remains publicly visible as a historical record
 *   - All documents and attachments remain publicly accessible
 *
 * Visual Flow:
 *   DRAFT → SCHEDULED → COMPLETED
 *   (Admin only)  (Public visible)  (Historical record)
 */
export const SESSION_STATUS_FLOW: Record<
	SessionStatus,
	readonly SessionStatus[]
> = {
	[SessionStatus.DRAFT]: [SessionStatus.SCHEDULED],
	[SessionStatus.SCHEDULED]: [SessionStatus.COMPLETED],
	[SessionStatus.COMPLETED]: [], // Terminal state
} as const;

/**
 * Get the valid next statuses for a session given its current status.
 * Returns an empty array if no transitions are valid (terminal state).
 */
export function getNextSessionStatuses(
	currentStatus: SessionStatus,
): readonly SessionStatus[] {
	return SESSION_STATUS_FLOW[currentStatus] ?? [];
}

/**
 * Check if a session status transition is valid.
 */
export function isSessionTransitionAllowed(
	currentStatus: SessionStatus,
	nextStatus: SessionStatus,
): boolean {
	return getNextSessionStatuses(currentStatus).includes(nextStatus);
}

/**
 * Get the initial status for a new session (always DRAFT).
 */
export function getInitialSessionStatus(): SessionStatus {
	return SessionStatus.DRAFT;
}

/**
 * Check if a status is a terminal (final) state.
 */
export function isTerminalSessionStatus(status: SessionStatus): boolean {
	return getNextSessionStatuses(status).length === 0;
}

/**
 * Check if a session is editable (draft status only).
 */
export function isSessionEditable(status: SessionStatus): boolean {
	return status === SessionStatus.DRAFT;
}

/**
 * Check if a session is publicly visible.
 */
export function isSessionPubliclyVisible(status: SessionStatus): boolean {
	return (
		status === SessionStatus.SCHEDULED || status === SessionStatus.COMPLETED
	);
}

// =============================================================================
// AGENDA DOCUMENT RULES
// =============================================================================

/**
 * Documents eligible to be added to a session agenda must have:
 * - status: 'calendared'
 *
 * Purpose is intentionally not part of session agenda source eligibility.
 */
export const AGENDA_DOCUMENT_ELIGIBLE_STATUS = "calendared" as const;
export const AGENDA_DOCUMENT_ELIGIBLE_PURPOSE = "for_agenda" as const;

/**
 * Check whether a document is eligible to be included in a session agenda.
 * Used when admins build agenda source pools.
 */
export function isDocumentEligibleForAgenda(
	status: string,
	_purpose?: string,
): boolean {
	return status === AGENDA_DOCUMENT_ELIGIBLE_STATUS;
}

// =============================================================================
// PUBLIC FILE ACCESS RULES
// =============================================================================

/**
 * Rules governing which files are publicly accessible via the session portal.
 * All signed URL generation is handled server-side; the server enforces these
 * rules before returning a URL. Clients should use the `useSessionFile` hook.
 *
 * Three publicly accessible file types:
 *
 * 1. Session agenda PDF
 *    Endpoint: GET /sessions/{id}/agenda-pdf-url
 *    Conditions:
 *      - session.status is 'scheduled' or 'completed'
 *      - session.agendaFilePath is set
 *
 * 2. Agenda item attachment
 *    Endpoint: GET /sessions/{sessionId}/agenda-items/{agendaItemId}/file-url
 *    Conditions:
 *      - session.status is 'scheduled' or 'completed'
 *      - agendaItem.sessionId matches sessionId (prevents IDOR)
 *      - agendaItem.attachmentPath is set
 *
 * 3. Legislative document file (by documentId)
 *    Endpoint: GET /sessions/{sessionId}/documents/{documentId}/file-url
 *    Conditions:
 *      - document is linked to an agenda item on the requested
 *        'scheduled' or 'completed' session
 *
 * Signed URLs expire after DEFAULT_SIGNED_URL_EXPIRY seconds.
 */

/**
 * Check whether the agenda PDF for a session may be served publicly.
 */
export function isSessionAgendaPdfPubliclyAccessible(
	sessionStatus: SessionStatus,
	agendaFilePath: string | null,
): boolean {
	return isSessionPubliclyVisible(sessionStatus) && agendaFilePath !== null;
}

/**
 * Check whether an agenda item's attachment file may be served publicly.
 * The caller must also verify the agenda item belongs to the given session.
 */
export function isAgendaItemAttachmentPubliclyAccessible(
	sessionStatus: SessionStatus,
	attachmentPath: string | null,
): boolean {
	return isSessionPubliclyVisible(sessionStatus) && attachmentPath !== null;
}

/**
 * Check whether a legislative document file may be served publicly.
 * The caller must also verify the document is linked to a publicly visible session.
 */
export function isDocumentFilePubliclyAccessible(
	sessionStatus: SessionStatus,
	_docStatus?: string,
	_docPurpose?: string,
): boolean {
	return isSessionPubliclyVisible(sessionStatus);
}
