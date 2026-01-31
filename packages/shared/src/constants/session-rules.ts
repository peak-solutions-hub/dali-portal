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
 *     * Approved documents from document tracker
 *     * Custom agenda items (Prayer, Roll Call, etc.)
 *   - Admin can reorder, edit, or delete agenda items
 *   - Session is saved as draft (not visible to public)
 *
 * DRAFT → SCHEDULED (Admin finalizes session):
 *   - Admin reviews and finalizes session agenda
 *   - Session status transitions to "scheduled"
 *   - Session becomes visible to public portal
 *   - Agenda is locked (no more changes allowed)
 *   - Citizens can view upcoming session details
 *
 * SCHEDULED → COMPLETED (After session concludes):
 *   - Admin marks session as completed after it takes place
 *   - Optional: Upload minutes and journal files
 *   - Session remains visible to public as historical record
 *   - Documents linked in agenda update their status to "calendared" then "published"
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
