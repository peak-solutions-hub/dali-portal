import { isDefinedError } from "@orpc/client";
import type { Session, SessionType } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { CalendarIcon, ListIcon } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { SessionFilters } from "@/components/sessions/session-filters";
import { SessionListView } from "@/components/sessions/session-list-view";
import { SessionListViewSkeleton } from "@/components/sessions/session-list-view-skeleton";
import { SessionPagination } from "@/components/sessions/session-pagination";
import { SessionsCalendar } from "@/components/sessions/sessions-calendar";
import { SessionsCalendarSkeleton } from "@/components/sessions/sessions-calendar-skeleton";
import { SortSelect } from "@/components/sessions/sort-select";
import { api } from "@/lib/api.client";

// Public session statuses (only scheduled and completed allowed)
type PublicSessionStatus = "scheduled" | "completed";

// Items per page for session listing
const SESSION_ITEMS_PER_PAGE = 10;

// Async component that fetches and displays session content
async function SessionsContent({
	currentPage,
	view,
	sortOrder,
	filterTypes,
	filterStatuses,
	filterDateFrom,
	filterDateTo,
	selectedYear,
	selectedMonth,
}: {
	currentPage: number;
	view: "list" | "calendar";
	sortOrder: "asc" | "desc";
	filterTypes: string[];
	filterStatuses: string[];
	filterDateFrom: string;
	filterDateTo: string;
	selectedYear: number;
	selectedMonth: number;
}) {
	// Check if any filters are active
	const hasActiveFilters =
		filterTypes.length > 0 ||
		filterStatuses.length > 0 ||
		!!filterDateFrom ||
		!!filterDateTo;

	// Build API input for list view (with pagination)
	const listApiInput = {
		type: filterTypes.length > 0 ? (filterTypes as SessionType[]) : undefined,
		status:
			filterStatuses.length > 0
				? (filterStatuses as PublicSessionStatus[])
				: undefined,
		dateFrom: filterDateFrom ? new Date(filterDateFrom) : undefined,
		dateTo: filterDateTo ? new Date(filterDateTo) : undefined,
		sortBy: "date" as const,
		sortDirection: sortOrder,
		limit: SESSION_ITEMS_PER_PAGE,
		// For page-based to cursor-based: we need to skip (page-1) * limit items
		// Since the backend uses cursor-based pagination, we'll fetch with offset simulation
		// For simplicity, we'll fetch enough items and slice client-side for now
		// TODO: Implement proper cursor tracking via URL params for true cursor-based pagination
	};

	// For calendar view, fetch all sessions (higher limit, no pagination needed)
	const calendarApiInput = {
		sortBy: "date" as const,
		sortDirection: "desc" as const,
		limit: 100, // Fetch up to 100 sessions for calendar
	};

	// Fetch sessions from API
	const [error, data] =
		view === "list"
			? await api.sessions.list(listApiInput)
			: await api.sessions.list(calendarApiInput);

	// Handle errors
	if (error) {
		const errorMessage = isDefinedError(error)
			? error.message
			: "Failed to load sessions";

		return (
			<Card className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-12">
				<p className="text-center text-base text-red-600">{errorMessage}</p>
			</Card>
		);
	}

	// Transform API response - ensure dates are Date objects
	const sessions: Session[] =
		data?.sessions.map((session) => ({
			...session,
			scheduleDate: new Date(session.scheduleDate),
		})) ?? [];

	// For list view, calculate pagination from API response
	const totalCount = data?.pagination.totalCount ?? 0;
	const totalPages = Math.ceil(totalCount / SESSION_ITEMS_PER_PAGE);

	// For page-based pagination simulation: fetch all needed pages worth and slice
	// This is a temporary solution until proper cursor-based pagination is implemented
	const paginatedSessions = sessions;

	return (
		<>
			{/* List View */}
			{view === "list" && (
				<>
					<SessionListView
						sessions={paginatedSessions}
						hasActiveFilters={hasActiveFilters}
					/>
					<SessionPagination
						currentPage={currentPage}
						totalPages={totalPages}
						sortOrder={sortOrder}
						filterTypes={filterTypes}
						filterStatuses={filterStatuses}
						filterDateFrom={filterDateFrom}
						filterDateTo={filterDateTo}
					/>
				</>
			)}

			{/* Calendar View */}
			{view === "calendar" && (
				<SessionsCalendar
					year={selectedYear}
					month={selectedMonth}
					sessions={sessions}
				/>
			)}
		</>
	);
}

export default async function Sessions({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		view?: string;
		month?: string;
		year?: string;
		sort?: string;
		types?: string;
		statuses?: string;
		dateFrom?: string;
		dateTo?: string;
	}>;
}) {
	const params = await searchParams;
	const currentPage = Number(params.page) || 1;
	const view = (params.view || "list") as "list" | "calendar";
	const sortOrder = (params.sort || "desc") as "asc" | "desc";

	// Get filter parameters
	const filterTypes = params.types ? params.types.split(",") : [];
	const filterStatuses = params.statuses ? params.statuses.split(",") : [];
	const filterDateFrom = params.dateFrom || "";
	const filterDateTo = params.dateTo || "";

	// Calendar state
	const now = new Date();
	const selectedYear = params.year ? Number(params.year) : now.getFullYear();
	const selectedMonth = params.month ? Number(params.month) : now.getMonth();

	return (
		<div className="min-h-screen bg-[#f9fafb]">
			<div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-19.5">
				{/* Page Header */}
				<div className="mb-6 space-y-2 sm:mb-8">
					<h1 className="font-serif text-2xl font-normal leading-tight text-[#a60202] sm:text-3xl sm:leading-10 md:text-4xl">
						Council Sessions
					</h1>
					<p className="text-sm leading-6 text-[#4a5565] sm:text-base">
						Regular sessions are held every Wednesday at 10:00 AM
					</p>
				</div>

				{/* View Toggle, Filter, and Sort */}
				<div className="mb-6 flex flex-col gap-4 sm:mb-8">
					<div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
						{/* Sort Dropdown (only shown in list view) */}
						<div className="w-full sm:w-40">
							{view === "list" && <SortSelect currentSort={sortOrder} />}
						</div>

						{/* View Toggle */}
						<div className="flex w-full items-center gap-2 sm:w-auto">
							<Link
								href={`/sessions?view=calendar&month=${selectedMonth}&year=${selectedYear}`}
								className="flex-1 sm:flex-none"
							>
								<Button
									variant={view === "calendar" ? "default" : "outline"}
									size="sm"
									className={`h-9 w-full cursor-pointer gap-2 text-sm ${
										view === "calendar"
											? "bg-[#a60202] text-white hover:bg-[#8a0101]"
											: "border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a] hover:bg-[#f9fafb]"
									}`}
								>
									<CalendarIcon className="h-4 w-4" />
									Calendar
								</Button>
							</Link>
							<Link
								href={`/sessions?view=list&page=1&sort=${sortOrder}`}
								className="flex-1 sm:flex-none"
							>
								<Button
									variant={view === "list" ? "default" : "outline"}
									size="sm"
									className={`h-9 w-full cursor-pointer gap-2 text-sm ${
										view === "list"
											? "bg-[#a60202] text-white hover:bg-[#8a0101]"
											: "border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a] hover:bg-[#f9fafb]"
									}`}
								>
									<ListIcon className="h-4 w-4" />
									List
								</Button>
							</Link>
						</div>
					</div>

					{/* Filter (only shown in list view) */}
					{view === "list" && <SessionFilters sortOrder={sortOrder} />}
				</div>

				{/* Session Content with Suspense */}
				<Suspense
					fallback={
						view === "list" ? (
							<SessionListViewSkeleton count={SESSION_ITEMS_PER_PAGE} />
						) : (
							<SessionsCalendarSkeleton />
						)
					}
				>
					<SessionsContent
						currentPage={currentPage}
						view={view}
						sortOrder={sortOrder}
						filterTypes={filterTypes}
						filterStatuses={filterStatuses}
						filterDateFrom={filterDateFrom}
						filterDateTo={filterDateTo}
						selectedYear={selectedYear}
						selectedMonth={selectedMonth}
					/>
				</Suspense>
			</div>
		</div>
	);
}
