"use client";

import type { Session } from "@repo/shared";
import {
	buildSessionQueryString,
	formatSessionTime,
	isSameDay,
	validateSessionSearchParams,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { ChevronLeftIcon, ChevronRightIcon } from "@repo/ui/lib/lucide-react";
import {
	getSessionStatusLabel,
	getSessionTypeBadgeClass,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface SessionsCalendarProps {
	sessions: Session[];
	year: number;
	month: number; // 0-indexed (0 = January, 11 = December)
}

// Calendar helper functions
function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 1).getDay();
}

export function SessionsCalendar({
	sessions,
	year,
	month,
}: SessionsCalendarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const daysInMonth = getDaysInMonth(year, month);
	const firstDay = getFirstDayOfMonth(year, month);
	const today = new Date();

	// Helper to get current filters as object
	const getCurrentFilters = React.useCallback(() => {
		// Convert searchParams to object for validation
		const paramsObj: Record<string, string> = {};
		searchParams.forEach((value, key) => {
			paramsObj[key] = value;
		});

		// Validate params to avoid using invalid values
		const validationResult = validateSessionSearchParams(paramsObj);

		const filters: Record<string, string | number | undefined> = {
			view: "calendar",
			month,
			year,
		};

		// If validation failed, just return base filters without additional params
		if (!validationResult.success) {
			return filters;
		}

		const validatedParams = validationResult.data;

		// Add validated filters
		if (validatedParams.types && validatedParams.types.length > 0) {
			filters.types = validatedParams.types.join(",");
		}
		if (validatedParams.statuses && validatedParams.statuses.length > 0) {
			filters.statuses = validatedParams.statuses.join(",");
		}
		if (validatedParams.dateFrom) {
			filters.dateFrom = validatedParams.dateFrom.toISOString().split("T")[0];
		}
		if (validatedParams.dateTo) {
			filters.dateTo = validatedParams.dateTo.toISOString().split("T")[0];
		}
		if (validatedParams.sort) {
			filters.sort = validatedParams.sort;
		}

		return filters;
	}, [month, year, searchParams]);

	const handleMonthChange = (newMonth: string) => {
		const monthIndex = Number.parseInt(newMonth);
		const filters = getCurrentFilters();
		filters.month = monthIndex;
		const queryString = buildSessionQueryString(filters);
		router.push(`/sessions?${queryString}`);
	};

	const handleYearChange = (newYear: string) => {
		const filters = getCurrentFilters();
		filters.year = Number.parseInt(newYear);
		const queryString = buildSessionQueryString(filters);
		router.push(`/sessions?${queryString}`);
	};

	// Calculate year range from session data
	const yearRange = React.useMemo(() => {
		if (sessions.length === 0) {
			return { minYear: year, maxYear: year };
		}

		const years = sessions.map((session) =>
			new Date(session.scheduleDate).getFullYear(),
		);
		const minYear = Math.min(...years);
		const maxYear = Math.max(...years);

		return { minYear, maxYear };
	}, [sessions, year]);

	// Build sessions map for quick lookup by date
	const sessionsMap = React.useMemo(() => {
		const map = new Map<string, Session[]>();
		sessions.forEach((session) => {
			const sessionDate = new Date(session.scheduleDate);
			const key = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}-${sessionDate.getDate()}`;
			if (!map.has(key)) {
				map.set(key, []);
			}
			map.get(key)?.push(session);
		});
		return map;
	}, [sessions]);

	// Generate calendar cells
	const calendarCells = React.useMemo(() => {
		const cells = [];
		const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

		for (let i = 0; i < totalCells; i++) {
			const day = i - firstDay + 1;
			const isCurrentMonth = day > 0 && day <= daysInMonth;

			if (isCurrentMonth) {
				const cellDate = new Date(year, month, day);
				const dateKey = `${year}-${month}-${day}`;
				const daySessions = sessionsMap.get(dateKey) || [];
				const isToday = isSameDay(cellDate, today);

				cells.push({
					day,
					isCurrentMonth: true,
					isToday,
					sessions: daySessions,
				});
			} else {
				// Previous or next month days
				const prevMonthDays = getDaysInMonth(
					month === 0 ? year - 1 : year,
					month === 0 ? 11 : month - 1,
				);
				const displayDay = day <= 0 ? prevMonthDays + day : day - daysInMonth;

				cells.push({
					day: displayDay,
					isCurrentMonth: false,
					isToday: false,
					sessions: [],
				});
			}
		}
		return cells;
	}, [year, month, daysInMonth, firstDay, today, sessionsMap]);

	// Navigation helpers
	const prevMonth = month === 0 ? 11 : month - 1;
	const prevYear = month === 0 ? year - 1 : year;
	const nextMonth = month === 11 ? 0 : month + 1;
	const nextYear = month === 11 ? year + 1 : year;

	// Helper to build nav URLs with filters
	const buildNavUrl = React.useCallback(
		(targetMonth: number, targetYear: number) => {
			const filters = getCurrentFilters();
			filters.month = targetMonth;
			filters.year = targetYear;
			return buildSessionQueryString(filters);
		},
		[getCurrentFilters],
	);

	return (
		<Card className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-4 sm:p-6">
			{/* Calendar Header */}
			<div className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-0">
				<div className="flex items-center gap-2">
					{/* Month Selector */}
					<Select value={month.toString()} onValueChange={handleMonthChange}>
						<SelectTrigger className="h-9 w-35 border-[rgba(0,0,0,0.1)] bg-white text-lg font-semibold cursor-pointer">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="cursor-pointer">
							{monthNames.map((name, index) => (
								<SelectItem
									key={index}
									value={index.toString()}
									className="cursor-pointer"
								>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Year Selector */}
					<Select value={year.toString()} onValueChange={handleYearChange}>
						<SelectTrigger className="h-9 w-25 border-[rgba(0,0,0,0.1)] bg-white text-lg font-semibold cursor-pointer">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="cursor-pointer">
							{Array.from(
								{ length: yearRange.maxYear - yearRange.minYear + 1 },
								(_, i) => yearRange.minYear + i,
							).map((y) => (
								<SelectItem
									key={y}
									value={y.toString()}
									className="cursor-pointer"
								>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex gap-2">
					<Link
						href={`/sessions?${buildNavUrl(today.getMonth(), today.getFullYear())}`}
					>
						<Button
							size="sm"
							variant="outline"
							className="h-9 border-[rgba(0,0,0,0.1)] bg-white px-3 text-sm cursor-pointer"
						>
							Today
						</Button>
					</Link>
					<Link href={`/sessions?${buildNavUrl(prevMonth, prevYear)}`}>
						<Button
							size="sm"
							variant="outline"
							className="h-9 w-9 border-[rgba(0,0,0,0.1)] bg-white p-0 cursor-pointer"
						>
							<ChevronLeftIcon className="h-4 w-4" />
						</Button>
					</Link>
					<Link href={`/sessions?${buildNavUrl(nextMonth, nextYear)}`}>
						<Button
							size="sm"
							variant="outline"
							className="h-9 w-9 border-[rgba(0,0,0,0.1)] bg-white p-0 cursor-pointer"
						>
							<ChevronRightIcon className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			</div>

			{/* Calendar Grid */}
			<div className="mb-4">
				{/* Day headers */}
				<div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
					{dayNames.map((day) => (
						<div key={day} className="text-center">
							<p className="text-xs sm:text-sm font-semibold text-[#4a5565]">
								{day}
							</p>
						</div>
					))}
				</div>

				{/* Calendar cells */}
				<div className="grid grid-cols-7 gap-1 sm:gap-2">
					{calendarCells.map((cell, index) => {
						// Determine border color based on session type
						const hasSessions = cell.sessions.length > 0;
						const firstSession = hasSessions ? cell.sessions[0] : null;

						// Priority: Session border > Today border > Default border
						const borderClass =
							hasSessions && firstSession
								? firstSession.type === "regular"
									? "border-2 border-[#a60202]"
									: "border-2 border-[#fe9a00]"
								: cell.isToday
									? "border-2 border-[#a60202]"
									: "border border-[rgba(0,0,0,0.1)]";

						// Background: Add status tint for sessions, lighter for today, white for current month, gray for other months
						const bgClass =
							hasSessions && firstSession
								? firstSession.status === "completed"
									? "bg-[#dcfce7]" // Light green for completed
									: "bg-[#dbeafe]" // Light blue for scheduled
								: cell.isToday && !hasSessions
									? "bg-[#a60202] bg-opacity-10"
									: cell.isCurrentMonth
										? "bg-white"
										: "bg-[#f9fafb]";

						const textClass = cell.isToday
							? "font-bold text-[#a60202]"
							: cell.isCurrentMonth
								? hasSessions
									? "font-bold text-[#364153]"
									: "text-[#364153]"
								: "text-[#99a1af]";

						// Create clickable link if there are sessions
						const cellContent = (
							<div
								className={`flex aspect-square flex-col overflow-hidden rounded-lg p-1 transition-all sm:p-2 ${borderClass} ${bgClass} ${
									hasSessions
										? "cursor-pointer hover:scale-[1.02] hover:shadow-md"
										: ""
								}`}
							>
								<div className="mb-0.5 flex shrink-0 items-center justify-between sm:mb-1">
									<p className={`text-xs sm:text-sm ${textClass}`}>
										{cell.day}
									</p>
									{cell.isToday && (
										<span className="hidden rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#dc2626] sm:inline">
											TODAY
										</span>
									)}
								</div>
								{/* Session info */}
								<div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden sm:gap-1">
									{cell.sessions.map((session) => (
										<div
											key={session.id}
											className="flex shrink-0 flex-col gap-0.5"
											title={`${getSessionTypeLabel(session.type)} #${session.sessionNumber} - ${formatSessionTime(session.scheduleDate)} - ${getSessionStatusLabel(session.status)}`}
										>
											<div className="hidden lg:flex items-center gap-1 text-xs text-[#4a5565] mb-0.5">
												<span>Session #{session.sessionNumber}</span>
											</div>
											{/* Mobile: Compact badge indicator */}
											<div
												className={`flex h-2 w-6 shrink-0 rounded sm:hidden ${getSessionTypeBadgeClass(
													session.type,
												)}`}
											/>
											{/* Tablet/Desktop: Badge */}
											<Badge
												className={`hidden h-auto shrink-0 rounded px-1 py-0.5 text-[8px] font-medium text-white sm:flex sm:text-[10px] ${getSessionTypeBadgeClass(
													session.type,
												)} hover:${getSessionTypeBadgeClass(session.type)}`}
											>
												<span className="lg:hidden">
													{session.type === "regular" ? "Reg" : "Spc"}
												</span>
												<span className="hidden lg:inline">
													{getSessionTypeLabel(session.type)}
												</span>
											</Badge>
										</div>
									))}
								</div>
							</div>
						);

						return hasSessions && firstSession ? (
							<Link
								key={index}
								href={`/sessions/${firstSession.id}?view=calendar&month=${month}&year=${year}`}
							>
								{cellContent}
							</Link>
						) : (
							<div key={index}>{cellContent}</div>
						);
					})}
				</div>
			</div>

			{/* Legend */}
			<div className="flex flex-col gap-3">
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="flex items-center gap-2 sm:min-w-45">
						<div className="h-6 w-6 shrink-0 rounded border-2 border-[#a60202] bg-white flex items-center justify-center">
							<div
								className={`h-2 w-4 rounded ${getSessionTypeBadgeClass("regular")}`}
							/>
						</div>
						<p className="text-xs sm:text-sm text-[#6b7280]">
							{getSessionTypeLabel("regular")}
						</p>
					</div>
					<div className="flex items-center gap-2 sm:min-w-45">
						<div className="h-6 w-6 shrink-0 rounded border-2 border-[#fe9a00] bg-white flex items-center justify-center">
							<div
								className={`h-2 w-4 rounded ${getSessionTypeBadgeClass("special")}`}
							/>
						</div>
						<p className="text-xs sm:text-sm text-[#6b7280]">
							{getSessionTypeLabel("special")}
						</p>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="flex items-center gap-2 sm:min-w-45">
						<div className="h-6 w-6 shrink-0 rounded bg-[#dcfce7] border border-[rgba(0,0,0,0.1)]" />
						<p className="text-xs sm:text-sm text-[#6b7280]">Completed</p>
					</div>
					<div className="flex items-center gap-2 sm:min-w-45">
						<div className="h-6 w-6 shrink-0 rounded bg-[#dbeafe] border border-[rgba(0,0,0,0.1)]" />
						<p className="text-xs sm:text-sm text-[#6b7280]">Scheduled</p>
					</div>
				</div>
			</div>
		</Card>
	);
}
