/**
 * Shared utility functions for Legislative Sessions
 * These are data manipulation and business logic utilities
 * UI-specific constants should be defined in the respective app (portal/admin)
 */

import { SessionStatus } from "../enums/session";
import type { Session } from "../schemas/session.schema";

// =============================================================================
// ROLE-BASED ACCESS CONSTANTS
// =============================================================================

/**
 * Session statuses visible to public users (scheduled and completed only)
 */
export const PUBLIC_SESSION_STATUSES: SessionStatus[] = [
	SessionStatus.SCHEDULED,
	SessionStatus.COMPLETED,
];

/**
 * Session statuses visible to admin users (all statuses including draft)
 */
export const ADMIN_SESSION_STATUSES: SessionStatus[] = [
	SessionStatus.DRAFT,
	SessionStatus.SCHEDULED,
	SessionStatus.COMPLETED,
];

// =============================================================================
// DATE & TIME FORMATTING
// =============================================================================

/**
 * Format a date to Philippine locale format (e.g., "Wednesday, January 15, 2024")
 */
export function formatSessionDate(date: Date | string): string {
	if (!date) return "N/A";

	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "N/A";

	try {
		return dateObj.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	} catch {
		return "N/A";
	}
}

/**
 * Format a time to 12-hour format (e.g., "10:00 AM")
 */
export function formatSessionTime(date: Date | string): string {
	if (!date) return "N/A";

	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "N/A";

	try {
		return dateObj.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	} catch {
		return "N/A";
	}
}

// =============================================================================
// ROLE-BASED FILTERING
// =============================================================================

/**
 * Filter sessions for public access (only scheduled and completed)
 * @param sessions - Array of sessions to filter
 * @returns Sessions visible to public users
 */
export function getPublicSessions(sessions: Session[]): Session[] {
	return sessions.filter((session) =>
		PUBLIC_SESSION_STATUSES.includes(session.status as SessionStatus),
	);
}

/**
 * Filter sessions for admin access (all statuses including draft)
 * @param sessions - Array of sessions to filter
 * @returns All sessions visible to admin users
 */
export function getAdminSessions(sessions: Session[]): Session[] {
	return sessions.filter((session) =>
		ADMIN_SESSION_STATUSES.includes(session.status as SessionStatus),
	);
}

/**
 * Filter sessions by role (public or admin)
 * @param sessions - Array of sessions to filter
 * @param role - User role ('public' or 'admin')
 * @returns Filtered sessions based on role
 */
export function filterSessionsByRole(
	sessions: Session[],
	role: "public" | "admin",
): Session[] {
	if (role === "admin") {
		return getAdminSessions(sessions);
	}
	return getPublicSessions(sessions);
}

// =============================================================================
// GENERAL FILTERING & SORTING
// =============================================================================

/**
 * Filter sessions by type, status, and date range
 */
export function filterSessions(
	sessions: Session[],
	options: {
		types?: string[];
		statuses?: string[];
		dateFrom?: string;
		dateTo?: string;
	},
): Session[] {
	const { types = [], statuses = [], dateFrom, dateTo } = options;

	return sessions.filter((session) => {
		// Filter by type
		if (types.length > 0 && !types.includes(session.type)) {
			return false;
		}

		// Filter by status
		if (statuses.length > 0 && !statuses.includes(session.status)) {
			return false;
		}

		// Filter by date range
		const sessionDate = new Date(session.scheduleDate);

		if (dateFrom) {
			const fromDate = new Date(dateFrom);
			if (sessionDate < fromDate) {
				return false;
			}
		}

		if (dateTo) {
			const toDate = new Date(dateTo);
			// Set to end of day to include the entire "to" date
			toDate.setHours(23, 59, 59, 999);
			if (sessionDate > toDate) {
				return false;
			}
		}

		return true;
	});
}

/**
 * Sort sessions by schedule date
 */
export function sortSessions(
	sessions: Session[],
	order: "asc" | "desc" = "desc",
): Session[] {
	return [...sessions].sort((a, b) => {
		const dateA = new Date(a.scheduleDate).getTime();
		const dateB = new Date(b.scheduleDate).getTime();
		return order === "desc" ? dateB - dateA : dateA - dateB;
	});
}

/**
 * Paginate sessions
 */
export function paginateSessions(
	sessions: Session[],
	page: number,
	itemsPerPage: number,
): { paginatedSessions: Session[]; totalPages: number } {
	const totalPages = Math.ceil(sessions.length / itemsPerPage);
	const startIndex = (page - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedSessions = sessions.slice(startIndex, endIndex);

	return { paginatedSessions, totalPages };
}

/**
 * Get available years from sessions
 */
export function getAvailableYearsFromSessions(sessions: Session[]): number[] {
	const years = sessions
		.map((session) => new Date(session.scheduleDate).getFullYear())
		.filter((year): year is number => typeof year === "number");

	return Array.from(new Set(years)).sort((a, b) => b - a);
}

/**
 * Get available months from sessions for a specific year
 */
export function getAvailableMonthsFromSessions(
	sessions: Session[],
	year: number,
): number[] {
	const months = sessions
		.filter((session) => new Date(session.scheduleDate).getFullYear() === year)
		.map((session) => new Date(session.scheduleDate).getMonth());

	return Array.from(new Set(months)).sort((a, b) => a - b);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}
