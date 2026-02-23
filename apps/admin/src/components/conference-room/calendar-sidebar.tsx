"use client";

import { CONFERENCE_ROOM_COLORS } from "@repo/shared";
import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	Clock,
	MapPin,
} from "lucide-react";
import type { CalendarBooking } from "@/utils/booking-helpers";
import {
	formatFullDate,
	getCalendarDays,
	isSameDay,
	monthNames,
} from "@/utils/date-utils";

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

	return (
		<div className="w-96 shrink-0 h-full flex flex-col">
			<div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-hidden">
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
				<div className="grid grid-cols-7 gap-2 mb-6">
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
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-gray-200">
					<span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
						Legend:
					</span>
					<div className="flex items-center gap-2">
						<div
							className={`w-3 h-3 rounded ${CONFERENCE_ROOM_COLORS.room_a.bg}`}
						/>
						<span className="text-xs text-gray-600">4th Floor</span>
					</div>
					<div className="flex items-center gap-2">
						<div
							className={`w-3 h-3 rounded ${CONFERENCE_ROOM_COLORS.room_b.bg}`}
						/>
						<span className="text-xs text-gray-600">7th Floor</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-[#f6bf26] rounded" />
						<span className="text-xs text-gray-600">Pending</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-gray-400 rounded" />
						<span className="text-xs text-gray-600">Done</span>
					</div>
				</div>

				{/* Bookings for Selected Date */}
				{hasBookings ? (
					<div className="mt-4 pt-4 border-t border-gray-200 flex-1 flex flex-col min-h-0">
						<h4 className="shrink-0 text-sm font-semibold text-gray-900 mb-3">
							Bookings for {formatFullDate(selectedDate)}
						</h4>
						<div className="space-y-3 flex-1 overflow-y-auto pr-2 pb-2">
							{bookings.map((booking) => {
								const roomColors = CONFERENCE_ROOM_COLORS[booking.roomKey];
								const isDone = booking.isPast && booking.status === "confirmed";
								const isExpired =
									booking.isPast && booking.status === "pending";
								const isPending =
									!booking.isPast && booking.status === "pending";

								const containerBg = isDone
									? "bg-gray-400"
									: isExpired
										? "bg-red-400"
										: isPending
											? "bg-[#f6bf26]"
											: roomColors.bg;

								const displayStatus = isDone
									? "done"
									: isExpired
										? "expired"
										: booking.status;

								return (
									<button
										key={booking.id}
										type="button"
										onClick={() => onViewBooking(booking)}
										className={`w-full text-left p-3 rounded-lg border hover:brightness-95 transition-[filter] flex flex-col gap-1 border-transparent ${containerBg}`}
									>
										<div className="flex justify-between items-start gap-3 w-full">
											<div className="flex-1 min-w-0 pr-2">
												<p
													className="text-xs font-bold text-white truncate mb-1.5"
													title={booking.purpose}
												>
													{booking.purpose}
												</p>
												<div className="flex flex-col gap-1 text-[11px] text-white/90">
													<div className="flex items-center gap-1.5">
														<MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" />
														<span
															className="font-medium truncate"
															title={booking.room}
														>
															{booking.room}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
														<span className="font-medium truncate">
															{booking.startTime} - {booking.endTime}
														</span>
													</div>
												</div>
											</div>
											<span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize shrink-0 shadow-sm bg-white/20 text-white border border-white/30">
												{displayStatus}
											</span>
										</div>
									</button>
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
