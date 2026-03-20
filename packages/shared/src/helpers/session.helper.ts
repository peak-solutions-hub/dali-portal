/**
 * Shared utility functions for Legislative Sessions
 */

import { z } from "zod";
import { SESSION_ITEMS_PER_PAGE } from "../constants/session-rules";
import {
	type GetSessionListInput,
	PublicSessionStatusEnum,
	type Session,
	SessionTypeEnum,
	type SessionWithAgenda,
	SortDirectionEnum,
} from "../schemas/session.schema";

// =============================================================================
// DATE & TIME FORMATTING
// =============================================================================

/**
 * Format a date to Philippine locale (PHT) using Asia/Manila timezone.
 * Example: "Wednesday, January 15, 2024"
 */
export function formatSessionDate(date: Date | string): string {
	if (!date) return "N/A";
	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "N/A";
	try {
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
 * Format a time to 12-hour format in Philippine Time (PHT).
 * Example: "10:00 AM PHT"
 */
export function formatSessionTime(date: Date | string): string {
	if (!date) return "N/A";
	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "N/A";
	try {
		const timeStr = dateObj.toLocaleTimeString("en-US", {
			timeZone: "Asia/Manila",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
		return `${timeStr} PHT`;
	} catch {
		return "N/A";
	}
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/** Check if two dates fall on the same calendar day. */
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

/** Build a URL query string from a filters object, omitting undefined/""/\"all\" values. */
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
 * Zod schema for validating URL search parameters.
 * Aligns with backend GetSessionListSchema but handles array values and 'all'.
 */
export const sessionSearchParamsSchema = z.object({
	types: z
		.string()
		.optional()
		.default("")
		.transform((val) => {
			if (!val || val === "all") return "all";
			return val.split(",").filter((v) => SessionTypeEnum.safeParse(v).success);
		}),
	statuses: z
		.string()
		.optional()
		.default("")
		.transform((val) => {
			if (!val || val === "all") return "all";
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

/** Validate session search parameters using Zod schema. */
export function validateSessionSearchParams(
	params: Record<string, string | undefined>,
) {
	return sessionSearchParamsSchema.safeParse(params);
}

/** Convert validated search params to API input format. Converts 'all' to undefined. */
export function toSessionApiFilters(
	params: SessionSearchParams,
): GetSessionListInput {
	return {
		type:
			params.types === "all"
				? undefined
				: (params.types as ("regular" | "special")[] | undefined),
		status:
			params.statuses === "all"
				? undefined
				: (params.statuses as ("scheduled" | "completed")[] | undefined),
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

/** API response shape before date transformation (scheduleDate is an ISO string). */
export type SessionAPIResponse = Omit<Session, "scheduleDate"> & {
	scheduleDate: string;
};

/** API response shape for SessionWithAgenda before date transformation. */
export type SessionWithAgendaAPIResponse = Omit<
	SessionWithAgenda,
	"scheduleDate"
> & {
	scheduleDate: string;
};

/** Convert ISO date strings from API response to Date objects. */
export function transformSessionDates(session: SessionAPIResponse): Session {
	return {
		...session,
		scheduleDate: new Date(session.scheduleDate),
	};
}

/** Transform SessionWithAgenda date strings to Date objects. */
export function transformSessionWithAgendaDates(
	session: SessionWithAgendaAPIResponse,
): SessionWithAgenda {
	return {
		...session,
		scheduleDate: new Date(session.scheduleDate),
	};
}

/** Transform an array of session API responses to Session objects with Date fields. */
export function transformSessionListDates(
	sessions: SessionAPIResponse[],
): Session[] {
	return sessions.map(transformSessionDates);
}
