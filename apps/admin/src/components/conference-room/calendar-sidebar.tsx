"use client";

import { CONFERENCE_ROOM_COLORS } from "@repo/shared";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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
		<div className="w-96 shrink-0">
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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
												: "text-gray-600 hover:bg-gray-100"
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
				<div className="space-y-3 pt-4 border-t border-gray-200">
					<div className="flex items-center gap-3">
						<div className="w-4 h-4 bg-blue-500 rounded" />
						<span className="text-sm text-gray-700">4th Floor</span>
					</div>
					<div className="flex items-center gap-3">
						<div className="w-4 h-4 bg-purple-500 rounded" />
						<span className="text-sm text-gray-700">7th Floor</span>
					</div>
					<div className="flex items-center gap-3">
						<div className="w-4 h-4 bg-yellow-400 rounded" />
						<span className="text-sm text-gray-700">Pending</span>
					</div>
				</div>

				{/* Bookings for Selected Date */}
				{hasBookings ? (
					<div className="mt-6 pt-4 border-t border-gray-200">
						<h4 className="text-sm font-semibold text-gray-900 mb-3">
							Bookings for {formatFullDate(selectedDate)}
						</h4>
						<div className="space-y-3">
							{bookings.map((booking) => {
								const roomColors = CONFERENCE_ROOM_COLORS[booking.roomKey];
								const isPending = booking.status === "pending";
								return (
									<button
										key={booking.id}
										type="button"
										onClick={() => onViewBooking(booking)}
										className={`w-full text-left p-3 rounded-lg border hover:brightness-95 transition-[filter] ${
											isPending
												? "bg-yellow-50 border-yellow-200"
												: roomColors.bg + " border-gray-200"
										}`}
									>
										<div className="flex items-start justify-between mb-2">
											<p className="text-sm font-semibold text-gray-900">
												{booking.startTime} - {booking.endTime}
											</p>
											<span
												className={`text-xs px-2 py-0.5 rounded-full font-medium ${
													isPending
														? "bg-yellow-100 text-yellow-700"
														: roomColors.label
												}`}
											>
												{booking.status}
											</span>
										</div>
										<p className="text-xs text-gray-600 mb-1">
											{booking.purpose}
										</p>
										<p
											className={`text-xs font-medium ${
												isPending ? "text-yellow-600" : roomColors.text
											}`}
										>
											{booking.room}
										</p>
									</button>
								);
							})}
						</div>
					</div>
				) : (
					<div className="mt-6 pt-4 border-t border-gray-200">
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
