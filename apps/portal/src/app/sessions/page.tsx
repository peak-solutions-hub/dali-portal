import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@repo/ui/components/pagination";
import { CalendarIcon, ListIcon } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { SessionsCalendar } from "@/components/sessions/sessions-calendar";
import { SortSelect } from "@/components/sessions/sort-select";
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

function formatDate(dateString: string) {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
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
	}>;
}) {
	const params = await searchParams;
	const currentPage = Number(params.page) || 1;
	const view = (params.view || "list") as "list" | "calendar";
	const sortOrder = (params.sort || "desc") as "asc" | "desc";

	// Sort sessions by date
	const sortedSessions = [...ALL_SESSIONS].sort((a, b) => {
		const dateA = new Date(a.date).getTime();
		const dateB = new Date(b.date).getTime();
		return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
	});

	const totalPages = Math.ceil(sortedSessions.length / ITEMS_PER_PAGE);

	// Calculate pagination for list view
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const MOCK_SESSIONS = sortedSessions.slice(startIndex, endIndex);

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

				{/* View Toggle and Sort */}
				<div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
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

				{/* List View */}
				{view === "list" && (
					<>
						<div className="space-y-3 sm:space-y-4">
							{MOCK_SESSIONS.map((session) => (
								<Card
									key={session.id}
									className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-4 sm:p-6"
								>
									<div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
										<div className="flex-1 space-y-2 w-full">
											<div className="flex flex-wrap items-center gap-2 sm:gap-3">
												<Badge
													className={`rounded-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium text-white ${
														session.type === "regular"
															? "bg-[#dc2626]"
															: "bg-[#fe9a00]"
													}`}
												>
													{session.type === "regular"
														? "Regular Session"
														: "Special Session"}
												</Badge>
												<Badge
													className={`rounded-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium ${
														session.status === "completed"
															? "bg-[#16a34a] text-white"
															: "bg-[#3b82f6] text-white"
													}`}
												>
													{session.status === "completed"
														? "Completed"
														: "Scheduled"}
												</Badge>
												<span className="text-xs sm:text-sm text-[#4a5565]">
													Session #{session.sessionNumber}
												</span>
											</div>
											<h2 className="text-base sm:text-lg font-semibold leading-6 sm:leading-7 text-[#0a0a0a]">
												{formatDate(session.date)}
											</h2>
											<p className="text-xs sm:text-sm text-[#4a5565]">
												Time: {session.time}
											</p>
										</div>
										<Link
											href={`/sessions/${session.id}`}
											className="w-full sm:w-auto"
										>
											<Button
												size="sm"
												className="h-8 sm:h-9 w-full sm:w-auto rounded-md bg-[#a60202] px-4 text-xs sm:text-sm text-white hover:bg-[#8a0101] cursor-pointer"
											>
												View Details
											</Button>
										</Link>
									</div>
								</Card>
							))}
						</div>

						{/* Empty State */}
						{MOCK_SESSIONS.length === 0 && (
							<Card className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-12">
								<p className="text-center text-base text-[#4a5565]">
									No legislative sessions scheduled at this time.
								</p>
							</Card>
						)}

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="mt-8 flex justify-center">
								<Pagination>
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												href={`/sessions?view=list&page=${
													currentPage - 1
												}&sort=${sortOrder}`}
												aria-disabled={currentPage === 1}
												className={
													currentPage === 1
														? "pointer-events-none opacity-50"
														: ""
												}
											/>
										</PaginationItem>

										{Array.from({ length: totalPages }, (_, i) => i + 1).map(
											(page) => {
												// Show first page, last page, current page, and pages around current
												const showPage =
													page === 1 ||
													page === totalPages ||
													Math.abs(page - currentPage) <= 1;

												if (!showPage) {
													// Show ellipsis for gaps
													if (
														page === currentPage - 2 ||
														page === currentPage + 2
													) {
														return (
															<PaginationItem key={page}>
																<PaginationEllipsis />
															</PaginationItem>
														);
													}
													return null;
												}

												return (
													<PaginationItem key={page}>
														<PaginationLink
															href={`/sessions?view=list&page=${page}&sort=${sortOrder}`}
															isActive={page === currentPage}
														>
															{page}
														</PaginationLink>
													</PaginationItem>
												);
											},
										)}

										<PaginationItem>
											<PaginationNext
												href={`/sessions?view=list&page=${
													currentPage + 1
												}&sort=${sortOrder}`}
												aria-disabled={currentPage === totalPages}
												className={
													currentPage === totalPages
														? "pointer-events-none opacity-50"
														: ""
												}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</div>
						)}
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
