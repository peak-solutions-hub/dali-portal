/**
 * @fileoverview Session Configuration Constants and Workflow Rules
 *
 * This file defines the core configuration and business logic for session management:
 * 1. Pagination limits for session listings
 * 2. Storage bucket names for session files
 * 3. Session Status workflow and transitions
 * 4. Default values and constraints
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
 * Used for validation in backend
 */
export const SESSION_MAX_ITEMS_PER_PAGE = 100;

/**
 * Minimum number of sessions that can be requested
 */
export const SESSION_MIN_ITEMS_PER_PAGE = 1;

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

/**
 * Supabase storage bucket name for session agenda files
 * Used by getSessionAgendaUrl in lib/sessions.ts
 */
export const SESSION_AGENDA_BUCKET = "session-agendas";

/**
 * Supabase storage bucket name for session agenda item attachments
 * Used for agenda item attachment downloads
 */
export const SESSION_AGENDA_ITEM_ATTACHMENTS_BUCKET =
	"session-agenda-item-attachments";

// =============================================================================
// FILE URL CONFIGURATION
// =============================================================================

/**
 * Default expiration time for signed URLs (in seconds)
 * 3600 seconds = 1 hour
 */
export const DEFAULT_SIGNED_URL_EXPIRY = 3600;

/**
 * Extended expiration time for session files that need longer access (in seconds)
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
 *     * Proposed/approved documents from the Document Tracker that have status 'approved' and purpose 'for_agenda'
 *     * Custom agenda items (Prayer, Roll Call, etc.)
 *   - Admin can reorder, edit, or delete agenda items
 *   - Session is saved as draft (not visible to public)
 *
 * DRAFT → SCHEDULED (Admin finalizes session):
 *   - Admin reviews and finalizes session agenda
 *   - Session status transitions to "scheduled"
 *   - Session agenda becomes visible to the public portal. Public view replaces attached source documents with concise summary labels for each agenda document (e.g., "f.01 DN: 25-06-0915: Proposed ordinance ..."). Agenda attachments are NOT accessible from the public portal.
 *   - Agenda is locked (no more changes allowed)
 *   - Citizens can view upcoming session details; full agenda documents and attachments are available only in Admin Presentation Mode (internal staff view).
 *
 * SCHEDULED → COMPLETED (After session concludes):
 *   - Admin marks session as completed after it takes place
 *   - Session remains visible to public as a historical record
 *   - Documents shown in the agenda are "proposed" documents that meet the following rules:
 *       • status: "approved"
 *       • purpose: "for_agenda"
 *   - Attached source documents are NOT available to the public portal. Instead the public portal shows a brief summary label for each agenda document (for example: "f.01 DN: 25-06-0915: Proposed ordinance ..."). Labels are numbered sequentially (f.01, f.02, ...) depending on the number of proposed ordinances, resolutions, and committee reports included in the agenda. Full agenda documents and attachments remain accessible only to internal staff via Admin Presentation Mode.
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
	const allowed = getNextSessionStatuses(currentStatus);
	return allowed.includes(nextStatus);
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
	const nextStatuses = getNextSessionStatuses(status);
	return nextStatuses.length === 0;
}

/**
 * Check if a session status is editable (draft status only).
 */
export function isSessionEditable(status: SessionStatus): boolean {
	return status === SessionStatus.DRAFT;
}

/**
 * Check if a session is visible to the public.
 */
export function isSessionPubliclyVisible(status: SessionStatus): boolean {
	return (
		status === SessionStatus.SCHEDULED || status === SessionStatus.COMPLETED
	);
}

// =============================================================================
// AGENDA DOCUMENT DISPLAY RULES
// =============================================================================

/**
 * Documents shown in session agendas on the public portal (including when scheduled) MUST:
 * - have status 'approved'
 * - have purpose 'for_agenda'
 */
export const AGENDA_DOCUMENT_VISIBLE_STATUS = "approved" as const;
export const AGENDA_DOCUMENT_PURPOSE_FOR_AGENDA = "for_agenda" as const;

/**
 * Attached documents are not served to the public portal. Public view shows
 * a concise label instead (see formatAgendaDocumentPublicLabel).
 */
export const ARE_AGENDA_DOCUMENT_ATTACHMENTS_PUBLIC = false;

/**
 * Internal-only flag: attachments and full source documents are available to admins
 * when viewing the agenda in Admin Presentation Mode.
 */
export const ARE_AGENDA_DOCUMENT_ATTACHMENTS_VISIBLE_TO_ADMIN = true;

/**
 * Check whether a document should be shown in the public agenda listing.
 */
export function isAgendaDocumentPubliclyVisible(
	status: string,
	purpose: string,
): boolean {
	return (
		status === AGENDA_DOCUMENT_VISIBLE_STATUS &&
		purpose === AGENDA_DOCUMENT_PURPOSE_FOR_AGENDA
	);
}

/**
 * Check whether a document should be visible in the public portal for a given
 * session status. This enforces both the session visibility rule (scheduled or
 * completed) and the document-level rules (status 'approved' and purpose
 * 'for_agenda').
 */
export function isAgendaDocumentVisibleOnSession(
	sessionStatus: SessionStatus,
	docStatus: string,
	docPurpose: string,
): boolean {
	return (
		isSessionPubliclyVisible(sessionStatus) &&
		isAgendaDocumentPubliclyVisible(docStatus, docPurpose)
	);
}

/**
 * Check whether a document may be included in a session agenda by admins.
 * Admins can include proposed/approved documents that have purpose 'for_agenda'.
 *
 * NOTE: This rule is intentionally identical to `isAgendaDocumentPubliclyVisible`.
 * We keep a separate exported function for clarity and to allow future divergence
 * without changing call sites. Internally delegate to the shared predicate.
 */
export function isAgendaDocumentAllowedForAdminBuild(
	status: string,
	purpose: string,
): boolean {
	// Delegate to the public predicate (approved + for_agenda)
	return isAgendaDocumentPubliclyVisible(status, purpose);
}

/**
 * Public agenda label formatting is provided by a helper in the shared helpers.
 * Use `formatAgendaDocumentPublicLabel` from `@repo/shared/helpers` (see `session.helper.ts`).
 */
