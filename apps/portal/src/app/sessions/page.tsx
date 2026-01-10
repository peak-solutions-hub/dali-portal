import { Button } from "@repo/ui/components/button";
import { CalendarIcon, ListIcon } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { SessionFilters } from "@/components/sessions/session-filters";
import { SessionListView } from "@/components/sessions/session-list-view";
import { SessionPagination } from "@/components/sessions/session-pagination";
import { SessionsCalendar } from "@/components/sessions/sessions-calendar";
import { SortSelect } from "@/components/sessions/sort-select";
import {
	filterSessions,
	paginateSessions,
	sortSessions,
} from "@/lib/session-utils";
import type { Session } from "@/types/session";

// Mock data for legislative sessions (sorted by date descending - newest/upcoming first)
const ALL_SESSIONS: Session[] = [
	{
		id: "10",
		sessionNumber: "129",
		type: "regular" as const,
		date: "2026-01-14",
		time: "10:00 AM",
		status: "scheduled" as const,
	},
	{
		id: "9",
		sessionNumber: "128",
		type: "regular" as const,
		date: "2026-01-10",
		time: "10:00 AM",
		status: "completed" as const,
	},
	{
		id: "8",
		sessionNumber: "127",
		type: "special" as const,
		date: "2025-12-30",
		time: "2:00 PM",
		status: "completed" as const,
	},
	{
		id: "7",
		sessionNumber: "126",
		type: "regular" as const,
		date: "2025-12-24",
		time: "10:00 AM",
		status: "completed" as const,
	},
	{
		id: "6",
		sessionNumber: "125",
		type: "regular" as const,
		date: "2025-12-17",
		time: "10:00 AM",
		status: "completed" as const,
	},
	{
		id: "5",
		sessionNumber: "124",
		type: "regular" as const,
		date: "2025-12-10",
		time: "10:00 AM",
		status: "completed" as const,
	},
	{
		id: "4",
		sessionNumber: "123",
		type: "special" as const,
		date: "2025-12-03",
		time: "2:00 PM",
		status: "completed" as const,
	},
	{
		id: "3",
		sessionNumber: "122",
		type: "regular" as const,
		date: "2025-11-26",
		time: "10:00 AM",
		status: "completed" as const,
	},
	{
		id: "2",
		sessionNumber: "121",
		type: "regular" as const,
		date: "2025-11-19",
		time: "10:00 AM",
		status: "completed" as const,
	},
	{
		id: "1",
		sessionNumber: "120",
		type: "regular" as const,
		date: "2025-11-12",
		time: "10:00 AM",
		status: "completed" as const,
	},
];

const ITEMS_PER_PAGE = 4;

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

	// Process sessions: sort, filter, paginate
	const sortedSessions = sortSessions(ALL_SESSIONS, sortOrder);
	const filteredSessions = filterSessions({
		sessions: sortedSessions,
		filterTypes,
		filterStatuses,
		filterDateFrom,
		filterDateTo,
	});
	const { paginatedSessions, totalPages } = paginateSessions(
		filteredSessions,
		currentPage,
		ITEMS_PER_PAGE,
	);

	// Check if any filters are active
	const hasActiveFilters =
		filterTypes.length > 0 ||
		filterStatuses.length > 0 ||
		!!filterDateFrom ||
		!!filterDateTo;

	// Calendar state
	const now = new Date();
	const selectedYear = params.year ? Number(params.year) : now.getFullYear();
	const selectedMonth = params.month ? Number(params.month) : now.getMonth();

	return (
		<div className="min-h-screen bg-[#f9fafb]">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				{/* Page Header */}
				<div className="mb-6 sm:mb-8 space-y-2">
					<h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal leading-tight sm:leading-10 text-[#a60202]">
						Council Sessions
					</h1>
					<p className="text-sm sm:text-base leading-6 text-[#4a5565]">
						Regular sessions are held every Wednesday at 10:00 AM
					</p>
				</div>

				{/* View Toggle, Filter, and Sort */}
				<div className="mb-6 sm:mb-8 flex flex-col gap-4">
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
						{/* Sort Dropdown (only shown in list view) */}
						<div className="w-full sm:w-40">
							{view === "list" && <SortSelect currentSort={sortOrder} />}
						</div>

						{/* View Toggle */}
						<div className="flex items-center gap-2 w-full sm:w-auto">
							<Link
								href={`/sessions?view=calendar&month=${selectedMonth}&year=${selectedYear}`}
								className="flex-1 sm:flex-none"
							>
								<Button
									variant={view === "calendar" ? "default" : "outline"}
									size="sm"
									className={`h-9 gap-2 text-sm w-full cursor-pointer ${
										view === "calendar"
											? "bg-[#a60202] text-white hover:bg-[#8a0101]"
											: "border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a]"
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
									className={`h-9 gap-2 text-sm w-full cursor-pointer ${
										view === "list"
											? "bg-[#a60202] text-white hover:bg-[#8a0101]"
											: "border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a]"
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
						sessions={sortedSessions}
					/>
				)}
			</div>
		</div>
	);
}
