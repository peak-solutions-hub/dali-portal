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
 * Session section display labels
 */
export const SESSION_SECTION_LABELS: Record<string, string> = {
	intro: "Intro",
	opening_prayer_invocation: "Opening Prayer/Invocation",
	national_anthem_and_pledge_of_allegiance:
		"National Anthem and Pledge of Allegiance",
	roll_call: "Roll Call",
	reading_and_or_approval_of_minutes: "Reading and/or Approval of the Minutes",
	agenda: "Agenda",
	first_reading_and_references: "First Reading and References",
	committee_report: "Committee Report",
	calendar_of_business: "Calendar of Business",
	third_reading: "Third Reading",
	other_matters: "Other Matters",
	closing_prayer: "Closing Prayer",
	adjournment: "Adjournment",
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

/**
 * Get the display label for a session section
 */
export function getSectionLabel(section: string): string {
	return SESSION_SECTION_LABELS[section] || section;
}
