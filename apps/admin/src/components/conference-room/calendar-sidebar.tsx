"use client";

import {
	formatFullDate,
	getCalendarDays,
	isSameDay,
	monthNames,
} from "@repo/shared";
import { CONFERENCE_ROOM_COLORS } from "@repo/ui/lib/conference-room-colors";
import {
	Calendar,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	MapPin,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CalendarBooking } from "@/utils/booking-helpers";

interface CalendarSidebarProps {
	currentDate: Date;
	selectedDate: Date;
	today: Date;
	bookings: CalendarBooking[];
	onPrevMonth: () => void;
	onNextMonth: () => void;
	onDateClick: (day: number) => void;
	onViewBooking: (booking: CalendarBooking) => void;
}

export function CalendarSidebar({
	currentDate,
	selectedDate,
	today,
	bookings,
	onPrevMonth,
	onNextMonth,
	onDateClick,
	onViewBooking,
}: CalendarSidebarProps) {
	const days = getCalendarDays(currentDate);
	const hasBookings = bookings.length > 0;

	type BookingGroupKey =
		| "pending"
		| "confirmed"
		| "completed"
		| "expired"
		| "rejected";

	const [collapsedGroups, setCollapsedGroups] = useState<
		Partial<Record<BookingGroupKey, boolean>>
	>({});

	const groupedBookings = useMemo(() => {
		const groups: Record<BookingGroupKey, CalendarBooking[]> = {
			pending: [],
			confirmed: [],
			completed: [],
			expired: [],
			rejected: [],
		};

		for (const booking of bookings) {
			const isCompleted = booking.isPast && booking.status === "confirmed";
			const isExpired = booking.isPast && booking.status === "pending";

			if (isCompleted) {
				groups.completed.push(booking);
				continue;
			}

			if (isExpired) {
				groups.expired.push(booking);
				continue;
			}

			if (booking.status === "pending") {
				groups.pending.push(booking);
				continue;
			}

			if (booking.status === "confirmed") {
				groups.confirmed.push(booking);
				continue;
			}

			groups.rejected.push(booking);
		}

		return groups;
	}, [bookings]);

	const groupOrder: BookingGroupKey[] = [
		"pending",
		"confirmed",
		"completed",
		"expired",
		"rejected",
	];

	const groupLabels: Record<BookingGroupKey, string> = {
		pending: "Pending",
		confirmed: "Confirmed",
		completed: "Completed",
		expired: "Expired",
		rejected: "Rejected",
	};

	const groupIndicatorClass: Record<BookingGroupKey, string> = {
		pending: "bg-[#f6bf26] border-[#efb100]",
		confirmed: "bg-emerald-500 border-emerald-600",
		completed: "bg-gray-400 border-gray-500",
		expired: "bg-red-400 border-red-500",
		rejected: "bg-rose-500 border-rose-600",
	};

	const toggleGroup = (group: BookingGroupKey) => {
		setCollapsedGroups((previous) => ({
			...previous,
			[group]: !previous[group],
		}));
	};

	return (
		<div className="w-104 shrink-0 h-full flex flex-col self-stretch">
			<div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm p-5">
				{/* Calendar Navigation */}
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-900">
						{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
					</h3>
					<div className="flex gap-1">
						<button
							onClick={onPrevMonth}
							className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
						>
							<ChevronLeft className="w-4 h-4 text-gray-600" />
						</button>
						<button
							onClick={onNextMonth}
							className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
						>
							<ChevronRight className="w-4 h-4 text-gray-600" />
						</button>
					</div>
				</div>

				{/* Day Headers */}
				<div className="grid grid-cols-7 gap-2 mb-2">
					{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
						<div
							key={day}
							className="text-center text-xs font-medium text-gray-500"
						>
							{day}
						</div>
					))}
				</div>

				{/* Calendar Grid */}
				<div className="grid grid-cols-7 gap-2 mb-5">
					{days.map((day, index) => {
						if (day === null)
							return <div key={`empty-${index}`} className="aspect-square" />;
						const dateAtSlot = new Date(
							currentDate.getFullYear(),
							currentDate.getMonth(),
							day,
						);
						const isCurrentToday = isSameDay(dateAtSlot, today);
						const isCurrentSelected = isSameDay(dateAtSlot, selectedDate);
						// Show dot only for the selected date if it has fetched bookings
						const hasBooking =
							isSameDay(dateAtSlot, selectedDate) && hasBookings;

						return (
							<button
								key={day}
								onClick={() => onDateClick(day)}
								className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all relative
									${
										isCurrentToday
											? "bg-red-600 text-white font-bold"
											: isCurrentSelected
												? "bg-gray-900 text-white"
												: "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
									}`}
							>
								{day}
								{hasBooking && !isCurrentToday && !isCurrentSelected && (
									<div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
								)}
							</button>
						);
					})}
				</div>

				{/* Legend */}
				<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
					<div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
						Legend
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-200 px-2 py-1">
							<div
								className={`w-2.5 h-2.5 rounded ${CONFERENCE_ROOM_COLORS.room_a.bg}`}
							/>
							<span className="text-[11px] text-gray-700">4th Floor Room</span>
						</div>
						<div className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-200 px-2 py-1">
							<div
								className={`w-2.5 h-2.5 rounded ${CONFERENCE_ROOM_COLORS.room_b.bg}`}
							/>
							<span className="text-[11px] text-gray-700">7th Floor Room</span>
						</div>
						<div className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-200 px-2 py-1">
							<div className="w-2.5 h-2.5 rounded bg-[#f6bf26]" />
							<span className="text-[11px] text-gray-700">Pending</span>
						</div>
						<div className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-200 px-2 py-1">
							<div className="w-2.5 h-2.5 rounded bg-gray-400" />
							<span className="text-[11px] text-gray-700">Completed</span>
						</div>
					</div>
				</div>

				{/* Bookings for Selected Date */}
				{hasBookings ? (
					<div className="mt-4 pt-4 border-t border-gray-200 flex-1 flex flex-col">
						<h4 className="text-sm font-semibold text-gray-900 mb-3">
							Bookings for {formatFullDate(selectedDate)}
						</h4>
						<div className="space-y-2">
							{groupOrder.map((group) => {
								const items = groupedBookings[group];
								if (items.length === 0) {
									return null;
								}

								const isCollapsed = collapsedGroups[group] === true;

								return (
									<div
										key={group}
										className="rounded-lg border border-gray-200 bg-white"
									>
										<button
											type="button"
											onClick={() => toggleGroup(group)}
											className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-gray-50 transition-colors"
										>
											<div className="flex items-center gap-2 min-w-0">
												<div
													className={`h-4 w-4 rounded-sm border ${groupIndicatorClass[group]}`}
												/>
												<span className="text-xs font-semibold text-gray-800 truncate">
													{groupLabels[group]}
												</span>
												<span className="text-[10px] font-medium text-gray-500">
													{items.length}
												</span>
											</div>
											<ChevronDown
												className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
											/>
										</button>

										{!isCollapsed && (
											<div className="border-t border-gray-100 px-2 py-1.5 space-y-1.5">
												{items.map((booking) => {
													const isCompleted =
														booking.isPast && booking.status === "confirmed";
													const isExpired =
														booking.isPast && booking.status === "pending";

													const statusLabel = isCompleted
														? "completed"
														: isExpired
															? "expired"
															: booking.status;

													return (
														<button
															key={booking.id}
															type="button"
															onClick={() => onViewBooking(booking)}
															className="w-full text-left rounded-md px-2 py-1.5 hover:bg-gray-50 transition-colors"
														>
															<div className="flex items-start gap-2">
																<div
																	className={`mt-0.5 h-3 w-3 rounded-sm border ${groupIndicatorClass[group]}`}
																/>
																<div className="min-w-0 flex-1">
																	<div
																		className="text-[11px] font-semibold text-gray-800 truncate"
																		title={booking.purpose}
																	>
																		{booking.purpose}
																	</div>
																	<div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500">
																		<Clock className="w-3 h-3 shrink-0" />
																		<span className="truncate">
																			{booking.startTime} - {booking.endTime}
																		</span>
																	</div>
																	<div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500">
																		<MapPin className="w-3 h-3 shrink-0" />
																		<span className="truncate">
																			{booking.room}
																		</span>
																	</div>
																</div>
																<span className="text-[10px] font-medium capitalize text-gray-500">
																	{statusLabel}
																</span>
															</div>
														</button>
													);
												})}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				) : (
					<div className="mt-4 pt-4 border-t border-gray-200">
						<div className="flex flex-col items-center justify-center py-6 text-center">
							<Calendar className="w-10 h-10 text-gray-300 mb-3" />
							<p className="text-sm text-gray-500 font-medium">
								No bookings for this date
							</p>
							<p className="text-xs text-gray-400 mt-1">
								{formatFullDate(selectedDate)}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
