import { isDefinedError } from "@orpc/client";
import type { Session, SessionType } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { CalendarIcon, ListIcon } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
	SessionFilters,
	SessionListView,
	SessionListViewSkeleton,
	SessionPaginationControls,
	SessionsCalendar,
	SessionsCalendarSkeleton,
	SortSelect,
} from "@/components/sessions";
import { api } from "@/lib/api.client";

// Public session statuses (only scheduled and completed allowed)
type PublicSessionStatus = "scheduled" | "completed";

// Items per page for session listing
const SESSION_ITEMS_PER_PAGE = 10;

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
		page: currentPage,
	};

	// For calendar view, fetch all sessions (higher limit, no pagination needed)
	const calendarApiInput = {
		sortBy: "date" as const,
		sortDirection: "desc" as const,
		limit: 100, // Fetch up to 100 sessions for calendar
		page: 1,
	};

	// Fetch sessions from API
	const [error, data] =
		view === "list"
			? await api.sessions.list(listApiInput)
			: await api.sessions.list(calendarApiInput);

	// Transform API response - ensure dates are Date objects
	const sessions: Session[] =
		data?.sessions.map((session) => ({
			...session,
			scheduleDate: new Date(session.scheduleDate),
		})) ?? [];

	// Get pagination info
	const pagination = data?.pagination || {
		currentPage: 1,
		totalPages: 0,
		totalCount: 0,
		itemsPerPage: SESSION_ITEMS_PER_PAGE,
		hasNextPage: false,
		hasPreviousPage: false,
	};

	// Build current filters for pagination
	const currentFilters = {
		types: filterTypes.join(",") || undefined,
		statuses: filterStatuses.join(",") || undefined,
		dateFrom: filterDateFrom || undefined,
		dateTo: filterDateTo || undefined,
		sort: sortOrder,
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-6 py-8 max-w-7xl">
				{/* Page Header */}
				<div className="mb-6">
					<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-['Playfair_Display']">
						Council Sessions
					</h1>
					<p className="text-gray-600 text-sm">
						Regular sessions are held every Wednesday at 10:00 AM
					</p>
				</div>

				{/* Desktop: Sticky Group (Filters + Sort + Pagination) */}
				<div className="hidden lg:block lg:sticky lg:top-0 lg:z-30 lg:bg-gray-50 lg:pb-4 lg:pt-4">
					<div className="flex flex-col gap-4 ">
						<div className="flex items-center justify-between">
							{/* Sort Dropdown (Left) */}
							<div className="w-40">
								{view === "list" && <SortSelect currentSort={sortOrder} />}
							</div>

							{/* View Toggle (Right) */}
							<div className="flex gap-2">
								<Link
									href={`/sessions?view=calendar&month=${selectedMonth}&year=${selectedYear}`}
								>
									<Button
										variant={view === "calendar" ? "default" : "outline"}
										size="sm"
										className={`h-9 cursor-pointer gap-2 text-sm ${
											view === "calendar"
												? "bg-[#a60202] text-white hover:bg-[#8a0101]"
												: "border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a] hover:bg-[#f9fafb]"
										}`}
									>
										<CalendarIcon className="h-4 w-4" />
										Calendar
									</Button>
								</Link>
								<Link href={`/sessions?view=list&page=1&sort=${sortOrder}`}>
									<Button
										variant={view === "list" ? "default" : "outline"}
										size="sm"
										className={`h-9 cursor-pointer gap-2 text-sm ${
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

						{/* Filters */}
						{view === "list" && <SessionFilters sortOrder={sortOrder} />}

						{/* Pagination (Below Filters) */}
						{view === "list" && sessions.length > 0 && (
							<div>
								<SessionPaginationControls
									pagination={pagination}
									currentFilters={currentFilters}
								/>
							</div>
						)}
					</div>
				</div>

				{/* Mobile: Sticky Group (Filters + Sort + Toggle) */}
				<div className="lg:hidden sticky top-0 z-30 bg-gray-50 pb-4 pt-4">
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-3">
							{/* Sort and Toggle Row */}
							<div className="flex justify-between gap-3">
								<div className="w-full">
									{view === "list" && <SortSelect currentSort={sortOrder} />}
								</div>
								<div className="flex shrink-0 gap-2">
									<Link
										href={`/sessions?view=calendar&month=${selectedMonth}&year=${selectedYear}`}
									>
										<Button
											variant={view === "calendar" ? "default" : "outline"}
											size="sm"
											className={`h-9 w-10 p-0 sm:w-auto sm:px-3 ${
												view === "calendar"
													? "bg-[#a60202] text-white hover:bg-[#8a0101]"
													: "border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a] hover:bg-[#f9fafb]"
											}`}
										>
											<CalendarIcon className="h-4 w-4" />
											<span className="hidden sm:inline ml-2">Calendar</span>
										</Button>
									</Link>
									<Link href={`/sessions?view=list&page=1&sort=${sortOrder}`}>
										<Button
											variant={view === "list" ? "default" : "outline"}
											size="sm"
											className={`h-9 w-10 p-0 sm:w-auto sm:px-3 ${
												view === "list"
													? "bg-[#a60202] text-white hover:bg-[#8a0101]"
													: "border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a] hover:bg-[#f9fafb]"
											}`}
										>
											<ListIcon className="h-4 w-4" />
											<span className="hidden sm:inline ml-2">List</span>
										</Button>
									</Link>
								</div>
							</div>

							{/* Filters */}
							{view === "list" && <SessionFilters sortOrder={sortOrder} />}
						</div>
					</div>
				</div>

				{/* Error Handling */}
				{error ? (
					<Card className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-12">
						<p className="text-center text-base text-red-600">
							{isDefinedError(error)
								? error.message
								: "Failed to load sessions"}
						</p>
					</Card>
				) : (
					<>
						{/* List View */}
						{view === "list" && (
							<div className="flex flex-col gap-4 pb-24 lg:pb-0">
								<SessionListView
									sessions={sessions}
									hasActiveFilters={hasActiveFilters}
								/>

								{/* Mobile Pagination - Sticky bottom */}
								{sessions.length > 0 && (
									<div className="lg:hidden sticky bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 p-4 shadow-lg">
										<SessionPaginationControls
											pagination={pagination}
											currentFilters={currentFilters}
										/>
									</div>
								)}
							</div>
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
				)}
			</div>
		</div>
	);
}
