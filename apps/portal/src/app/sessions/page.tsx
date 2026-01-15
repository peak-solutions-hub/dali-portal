import { isDefinedError } from "@orpc/client";
import type { Session, SessionType } from "@repo/shared";
import {
	buildSessionQueryString,
	toSessionApiFilters,
	transformSessionListDates,
	validateSessionSearchParams,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { CalendarIcon, ListIcon } from "@repo/ui/lib/lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	SessionFilters,
	SessionListView,
	SessionPaginationControls,
	SessionsCalendar,
	SortSelect,
} from "@/components/sessions";
import { api } from "@/lib/api.client";

export const metadata: Metadata = {
	title: "Council Sessions — Iloilo City",
	description:
		"Browse Iloilo City Council sessions. Regular sessions are held every Wednesday at 10:00 AM. View schedules, agendas, and session details.",
	openGraph: {
		title: "Council Sessions — Iloilo City",
		description:
			"Browse Iloilo City Council sessions with schedules, agendas, and detailed information about regular and special sessions.",
		type: "website",
		url: "/sessions",
	},
	twitter: {
		card: "summary_large_image",
		title: "Council Sessions — Iloilo City",
		description:
			"Browse Iloilo City Council sessions. Regular sessions held every Wednesday at 10:00 AM.",
	},
};

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

	// Validate search parameters with Zod
	const validationResult = validateSessionSearchParams(params);

	// If validation fails, redirect to valid default params
	if (!validationResult.success) {
		const queryString = buildSessionQueryString({
			view: "list",
			page: "1",
			sort: "desc",
		});
		redirect(`/sessions?${queryString}`);
	}

	const validatedParams = validationResult.data;

	const currentPage = validatedParams.page;
	const view = validatedParams.view;
	const sortOrder = validatedParams.sort;

	// Get filter parameters from validated params
	const filterTypes = validatedParams.types || [];
	const filterStatuses = validatedParams.statuses || [];
	const filterDateFrom = validatedParams.dateFrom;
	const filterDateTo = validatedParams.dateTo;

	// Calendar state
	const now = new Date();
	const selectedYear = validatedParams.year ?? now.getFullYear();
	const selectedMonth = validatedParams.month ?? now.getMonth();

	// Check if any filters are active
	const hasActiveFilters =
		filterTypes.length > 0 ||
		filterStatuses.length > 0 ||
		!!filterDateFrom ||
		!!filterDateTo;

	// Convert to API input format
	const listApiInput = toSessionApiFilters(validatedParams);

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

	// Handle API errors with user-visible message
	if (error) {
		console.error("API error fetching sessions:", error);

		let errorMessage = "An unexpected error occurred";
		if (isDefinedError(error)) {
			errorMessage = error.message || errorMessage;
		}

		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-3 sm:py-4">
					<div className="mb-6">
						<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-['Playfair_Display']">
							Council Sessions
						</h1>
						<p className="text-gray-600 text-sm">
							Regular sessions are held every Wednesday at 10:00 AM
						</p>
					</div>
					<Card className="p-12 border-red-200 bg-red-50">
						<div className="text-center">
							<p className="text-lg mb-2 text-red-800 font-semibold">
								Unable to Load Sessions
							</p>
							<p className="text-sm text-red-700 mb-4">
								We're experiencing technical difficulties loading the sessions.
								Please try refreshing the page.
							</p>
							<p className="text-xs text-red-600">Error: {errorMessage}</p>
						</div>
					</Card>
				</div>
			</div>
		);
	}

	// Transform API response - ensure dates are Date objects
	const sessions: Session[] = data?.sessions
		? transformSessionListDates(data.sessions)
		: [];

	// Get pagination info
	const pagination = data?.pagination || {
		currentPage: 1,
		totalPages: 0,
		totalCount: 0,
		itemsPerPage: validatedParams.limit,
		hasNextPage: false,
		hasPreviousPage: false,
	};

	// Build current filters for pagination
	const currentFilters = {
		types: filterTypes.length > 0 ? filterTypes.join(",") : undefined,
		statuses: filterStatuses.length > 0 ? filterStatuses.join(",") : undefined,
		dateFrom: filterDateFrom
			? filterDateFrom.toISOString().split("T")[0]
			: undefined,
		dateTo: filterDateTo ? filterDateTo.toISOString().split("T")[0] : undefined,
		sort: sortOrder,
	};

	// Construct base filter query string (excluding view-specific params like page/month/year)
	const filterQueryString = buildSessionQueryString({
		types: currentFilters.types,
		statuses: currentFilters.statuses,
		dateFrom: currentFilters.dateFrom,
		dateTo: currentFilters.dateTo,
		sort: sortOrder,
	});
	const calendarHref = `/sessions?view=calendar&month=${selectedMonth}&year=${selectedYear}${filterQueryString ? `&${filterQueryString}` : ""}`;
	const listHref = `/sessions?view=list&page=1${filterQueryString ? `&${filterQueryString}` : ""}`;

	// Params for list items (preserving page and filters)
	const listItemQueryString = buildSessionQueryString({
		view: "list",
		page: currentPage > 1 ? currentPage : undefined,
		...currentFilters,
	});

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-3 sm:py-4">
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
				<div
					className={`hidden lg:block lg:sticky lg:top-0 lg:z-30 ${view !== "calendar" ? "lg:pb-4" : ""}`}
				>
					<div className="flex flex-col gap-4 lg:bg-gray-50 lg:pt-4">
						<div className="flex items-start justify-between gap-4">
							{/* Left Group: Sort & Filters */}
							<div className="flex items-start gap-4 flex-1">
								{/* Sort Dropdown */}
								<div className="w-40 shrink-0">
									{view === "list" && <SortSelect currentSort={sortOrder} />}
								</div>
								{/* Filters */}
								{view === "list" && (
									<div className="flex-1">
										<SessionFilters sortOrder={sortOrder} />
									</div>
								)}
							</div>

							{/* View Toggle (Right) */}
							<div
								className={`flex gap-2 shrink-0 ${view === "calendar" ? "pb-4" : ""}`}
							>
								<Link href={calendarHref}>
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
								<Link href={listHref}>
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
									<Link href={calendarHref}>
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
									<Link href={listHref}>
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

				{/* List View and Calendar View */}
				{sessions.length > 0 || hasActiveFilters ? (
					<>
						{/* List View */}
						{view === "list" && (
							<div className="flex flex-col gap-4 pb-24 lg:pb-0">
								<SessionListView
									sessions={sessions}
									hasActiveFilters={hasActiveFilters}
									queryString={listItemQueryString}
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
				) : (
					<Card className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-12">
						<div className="text-center">
							<p className="text-lg mb-2 text-gray-800">No sessions found</p>
							<p className="text-sm text-gray-600">
								There are no sessions available at this time.
							</p>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
