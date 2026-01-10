import type { Session } from "@repo/shared";

interface FilterSessionsParams {
	sessions: Session[];
	filterTypes: string[];
	filterStatuses: string[];
	filterDateFrom: string;
	filterDateTo: string;
}

export function filterSessions({
	sessions,
	filterTypes,
	filterStatuses,
	filterDateFrom,
	filterDateTo,
}: FilterSessionsParams): Session[] {
	return sessions.filter((session) => {
		// Filter by type
		if (filterTypes.length > 0 && !filterTypes.includes(session.type)) {
			return false;
		}

		// Filter by status
		if (filterStatuses.length > 0 && !filterStatuses.includes(session.status)) {
			return false;
		}

		// Filter by date range
		const sessionDate = new Date(session.scheduleDate);

		if (filterDateFrom) {
			const fromDate = new Date(filterDateFrom);
			if (sessionDate < fromDate) {
				return false;
			}
		}

		if (filterDateTo) {
			const toDate = new Date(filterDateTo);
			// Set to end of day to include the entire "to" date
			toDate.setHours(23, 59, 59, 999);
			if (sessionDate > toDate) {
				return false;
			}
		}

		return true;
	});
}

export function sortSessions(
	sessions: Session[],
	order: "asc" | "desc",
): Session[] {
	return [...sessions].sort((a, b) => {
		const dateA = new Date(a.scheduleDate).getTime();
		const dateB = new Date(b.scheduleDate).getTime();
		return order === "desc" ? dateB - dateA : dateA - dateB;
	});
}

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
