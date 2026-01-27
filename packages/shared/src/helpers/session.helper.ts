/**
 * Shared utility functions for Legislative Sessions
 * These are data manipulation and business logic utilities
 * UI-specific constants should be defined in the respective app (portal/admin)
 */

import { z } from "zod";
import { SESSION_ITEMS_PER_PAGE } from "../constants/session-rules";
import { SessionStatus } from "../enums/session";
import type {
	GetSessionListInput,
	Session,
	SessionWithAgenda,
} from "../schemas/session.schema";
import {
	PublicSessionStatusEnum,
	SessionTypeEnum,
	SortDirectionEnum,
} from "../schemas/session.schema";

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
// PAGINATION CONSTANTS
// =============================================================================

// =============================================================================
// DATE & TIME FORMATTING
// =============================================================================

/**
 * Format a date to Philippine locale (PHT) using Asia/Manila timezone
 * Example: "Wednesday, January 15, 2024"
 */
export function formatSessionDate(date: Date | string): string {
	if (!date) return "N/A";

	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "N/A";

	try {
		// Force timezone to Asia/Manila so the displayed date is always in PHT
		return dateObj.toLocaleDateString("en-US", {
			timeZone: "Asia/Manila",
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
 * Format a time to 12-hour format in Philippine Time (PHT)
 * Example: "10:00 AM PHT"
 */
export function formatSessionTime(date: Date | string): string {
	if (!date) return "N/A";

	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "N/A";

	try {
		// Force timezone to Asia/Manila so the displayed time is always in PHT
		const timeStr = dateObj.toLocaleTimeString("en-US", {
			timeZone: "Asia/Manila",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});

		// Append explicit PHT label for clarity (consistent across environments)
		return `${timeStr} PHT`;
	} catch {
		return "N/A";
	}
}

/**
 * Format a concise public label for an agenda document.
 *
 * Example:
 * formatAgendaDocumentPublicLabel(1, '25-06-0915', 'Proposed ordinance on ...')
 * returns: 'f.01 DN: 25-06-0915: Proposed ordinance on ...'
 *
 * The index is 1-based and padded to two digits (f.01, f.02, ...).
 */
export function formatAgendaDocumentPublicLabel(
	index: number,
	docNumber?: string,
	title?: string,
): string {
	const idx = String(index).padStart(2, "0");
	const prefix = `f.${idx}`;
	const dn = docNumber ? ` DN: ${docNumber}` : "";
	const shortTitle = title ? `: ${title}` : ": Proposed document";
	return `${prefix}${dn}${shortTitle}`;
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

// =============================================================================
// QUERY STRING UTILITIES
// =============================================================================

/**
 * Build a query string from filters
 */
export function buildSessionQueryString(
	filters: Record<string, string | number | undefined>,
): string {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== "" && value !== "all") {
			params.set(key, String(value));
		}
	}

	return params.toString();
}

// =============================================================================
// SEARCH PARAMS VALIDATION
// =============================================================================

/**
 * Zod schema for validating URL search parameters
 * Aligns with backend GetSessionListSchema but handles array values
 */
export const sessionSearchParamsSchema = z.object({
	types: z
		.string()
		.optional()
		.default("")
		.transform((val) => {
			if (!val) return undefined;
			return val.split(",").filter((v) => SessionTypeEnum.safeParse(v).success);
		}),
	statuses: z
		.string()
		.optional()
		.default("")
		.transform((val) => {
			if (!val) return undefined;
			return val
				.split(",")
				.filter((v) => PublicSessionStatusEnum.safeParse(v).success);
		}),
	dateFrom: z
		.string()
		.optional()
		.default("")
		.transform((val) => {
			if (!val) return undefined;
			const date = new Date(val);
			return Number.isNaN(date.getTime()) ? undefined : date;
		}),
	dateTo: z
		.string()
		.optional()
		.default("")
		.transform((val) => {
			if (!val) return undefined;
			const date = new Date(val);
			return Number.isNaN(date.getTime()) ? undefined : date;
		}),
	sort: SortDirectionEnum.optional().default("desc"),
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.default(SESSION_ITEMS_PER_PAGE),
	view: z.enum(["list", "calendar"]).optional().default("list"),
	month: z.coerce.number().int().min(0).max(11).optional(),
	year: z.coerce.number().int().min(1950).max(2100).optional(),
});

export type SessionSearchParams = z.infer<typeof sessionSearchParamsSchema>;

/**
 * Validate session search parameters using Zod schema
 */
export function validateSessionSearchParams(
	params: Record<string, string | undefined>,
) {
	return sessionSearchParamsSchema.safeParse(params);
}

/**
 * Convert validated search params to API input format
 */
export function toSessionApiFilters(
	params: SessionSearchParams,
): GetSessionListInput {
	return {
		type: params.types as ("regular" | "special")[] | undefined,
		status: params.statuses as ("scheduled" | "completed")[] | undefined,
		dateFrom: params.dateFrom,
		dateTo: params.dateTo,
		sortBy: "date",
		sortDirection: params.sort,
		limit: params.limit,
		page: params.page,
	};
}

// =============================================================================
// DATE TRANSFORMATION
// =============================================================================

/**
 * Type for API response where dates are ISO strings (before transformation)
 */
export type SessionAPIResponse = Omit<Session, "scheduleDate"> & {
	scheduleDate: string;
};

/**
 * Type for SessionWithAgenda API response
 */
export type SessionWithAgendaAPIResponse = Omit<
	SessionWithAgenda,
	"scheduleDate"
> & {
	scheduleDate: string;
};

/**
 * Convert ISO date strings from API response to Date objects
 * oRPC/HTTP serializes Date objects as ISO strings, so we need to convert them back
 */
export function transformSessionDates(session: SessionAPIResponse): Session {
	return {
		...session,
		scheduleDate: new Date(session.scheduleDate),
	};
}

/**
 * Transform SessionWithAgenda date strings to Date objects
 */
export function transformSessionWithAgendaDates(
	session: SessionWithAgendaAPIResponse,
): SessionWithAgenda {
	return {
		...session,
		scheduleDate: new Date(session.scheduleDate),
	};
}

/**
 * Transform multiple sessions' date strings to Date objects
 */
export function transformSessionListDates(
	sessions: SessionAPIResponse[],
): Session[] {
	return sessions.map(transformSessionDates);
}
