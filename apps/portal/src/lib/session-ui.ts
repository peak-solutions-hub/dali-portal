/**
 * UI-specific constants and helpers for Legislative Sessions (Portal App)
 * These are presentation-layer utilities used for display and styling
 */

/**
 * Session type display labels
 */
export const SESSION_TYPE_LABELS: Record<string, string> = {
	regular: "Regular Session",
	special: "Special Session",
};

/**
 * Session status display labels
 */
export const SESSION_STATUS_LABELS: Record<string, string> = {
	scheduled: "Scheduled",
	completed: "Completed",
};

/**
 * Session types for filtering (used in UI dropdowns)
 */
export const SESSION_TYPES = [
	{ value: "regular", label: "Regular Session" },
	{ value: "special", label: "Special Session" },
] as const;

/**
 * Session statuses for filtering (used in UI dropdowns)
 */
export const SESSION_STATUSES = [
	{ value: "scheduled", label: "Scheduled" },
	{ value: "completed", label: "Completed" },
] as const;

/**
 * Badge color classes for session types
 */
export const SESSION_TYPE_BADGE_COLORS: Record<string, string> = {
	regular: "bg-[#dc2626]",
	special: "bg-[#fe9a00]",
};

/**
 * Badge color classes for session statuses
 */
export const SESSION_STATUS_BADGE_COLORS: Record<string, string> = {
	completed: "bg-[#16a34a]",
	scheduled: "bg-[#3b82f6]",
};

/**
 * Get the display label for a session type
 */
export function getSessionTypeLabel(type: string): string {
	return SESSION_TYPE_LABELS[type] || type;
}

/**
 * Get the display label for a session status
 */
export function getSessionStatusLabel(status: string): string {
	return SESSION_STATUS_LABELS[status] || status;
}

/**
 * Get badge color class for session type
 */
export function getSessionTypeBadgeClass(type: string): string {
	return SESSION_TYPE_BADGE_COLORS[type] || "bg-gray-500";
}

/**
 * Get badge color class for session status
 */
export function getSessionStatusBadgeClass(status: string): string {
	return SESSION_STATUS_BADGE_COLORS[status] || "bg-gray-500";
}
