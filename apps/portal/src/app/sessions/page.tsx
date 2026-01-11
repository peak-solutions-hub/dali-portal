import type { Session } from "@repo/shared";
import {
	filterSessions,
	getPublicSessions,
	paginateSessions,
	SESSION_ITEMS_PER_PAGE,
	sortSessions,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { CalendarIcon, ListIcon } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { SessionFilters } from "@/components/sessions/session-filters";
import { SessionListView } from "@/components/sessions/session-list-view";
import { SessionPagination } from "@/components/sessions/session-pagination";
import { SessionsCalendar } from "@/components/sessions/sessions-calendar";
import { SortSelect } from "@/components/sessions/sort-select";

// Mock data for legislative sessions (sorted by date descending - newest/upcoming first)
const ALL_SESSIONS: Session[] = [
	{
		id: "10",
		sessionNumber: 129,
		type: "regular",
		scheduleDate: new Date("2026-01-14T10:00:00"),
		status: "scheduled",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "9",
		sessionNumber: 128,
		type: "regular",
		scheduleDate: new Date("2026-01-10T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "8",
		sessionNumber: 127,
		type: "special",
		scheduleDate: new Date("2025-12-30T14:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "7",
		sessionNumber: 126,
		type: "regular",
		scheduleDate: new Date("2025-12-24T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "6",
		sessionNumber: 125,
		type: "regular",
		scheduleDate: new Date("2025-12-17T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "5",
		sessionNumber: 124,
		type: "regular",
		scheduleDate: new Date("2025-12-10T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "4",
		sessionNumber: 123,
		type: "special",
		scheduleDate: new Date("2025-12-03T14:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "3",
		sessionNumber: 122,
		type: "regular",
		scheduleDate: new Date("2025-11-26T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "2",
		sessionNumber: 121,
		type: "regular",
		scheduleDate: new Date("2025-11-19T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "1",
		sessionNumber: 120,
		type: "regular",
		scheduleDate: new Date("2025-11-12T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "11",
		sessionNumber: 119,
		type: "regular",
		scheduleDate: new Date("2025-11-05T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "12",
		sessionNumber: 118,
		type: "special",
		scheduleDate: new Date("2025-10-29T14:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
	{
		id: "13",
		sessionNumber: 117,
		type: "regular",
		scheduleDate: new Date("2025-10-22T10:00:00"),
		status: "completed",
		agendaFilePath: null,
		minutesFilePath: null,
		journalFilePath: null,
	},
];

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

	// Process sessions: filter for public access (only scheduled and completed), sort, filter, paginate
	const publicSessions = getPublicSessions(ALL_SESSIONS);
	const sortedSessions = sortSessions(publicSessions, sortOrder);
	const filteredSessions = filterSessions(sortedSessions, {
		types: filterTypes,
		statuses: filterStatuses,
		dateFrom: filterDateFrom,
		dateTo: filterDateTo,
	});
	const { paginatedSessions, totalPages } = paginateSessions(
		filteredSessions,
		currentPage,
		SESSION_ITEMS_PER_PAGE,
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
