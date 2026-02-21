"use client";

import { CONFERENCE_ROOM_COLORS } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarBooking } from "@/utils/booking-helpers";
import {
	dayNames,
	getCalendarDays,
	isSameDay,
	monthNames,
} from "@/utils/date-utils";

interface MonthViewProps {
	currentDate: Date;
	selectedDate: Date;
	today: Date;
	bookings: CalendarBooking[];
	onPrevMonth: () => void;
	onNextMonth: () => void;
	onToday: () => void;
	onSwitchToDay: () => void;
	onDateClick: (day: number) => void;
}

export function MonthView({
	currentDate,
	selectedDate,
	today,
	bookings,
	onPrevMonth,
	onNextMonth,
	onToday,
	onSwitchToDay,
	onDateClick,
}: MonthViewProps) {
	const days = getCalendarDays(currentDate);

	return (
		<div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
			{/* Header */}
			<div className="shrink-0 flex items-center justify-between p-6 border-b border-gray-100 bg-white">
				<div className="flex items-center gap-4">
					<h2 className="text-xl font-bold text-gray-900">
						{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
					</h2>
					<div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
						<button
							onClick={onPrevMonth}
							className="p-2 hover:bg-gray-50 border-r border-gray-200"
						>
							<ChevronLeft className="w-4 h-4 text-gray-600" />
						</button>
						<button onClick={onNextMonth} className="p-2 hover:bg-gray-50">
							<ChevronRight className="w-4 h-4 text-gray-600" />
						</button>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button onClick={onSwitchToDay} variant="outline" size="sm">
						Day View
					</Button>
					<Button onClick={onToday} variant="outline" size="sm">
						Today
					</Button>
				</div>
			</div>

			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Day name headers */}
				<div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
					{dayNames.map((dayName) => {
						const shortName = dayName.slice(0, 3).toUpperCase();
						return (
							<div
								key={shortName}
								className="py-2 text-center text-[10px] font-bold text-gray-400 tracking-widest border-r border-gray-100 last:border-r-0"
							>
								{shortName}
							</div>
						);
					})}
				</div>

				{/* Grid */}
				<div className="flex-1 grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
					{days.map((day, index) => {
						const dateAtSlot = day
							? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
							: null;
						const isCurrentToday = dateAtSlot
							? isSameDay(dateAtSlot, today)
							: false;

						// Filter bookings for this specific day
						const dayBookings = dateAtSlot
							? bookings.filter((b) => isSameDay(b.date, dateAtSlot))
							: [];
						const maxVisible = 3;
						const visibleBookings = dayBookings.slice(0, maxVisible);
						const overflowCount = dayBookings.length - maxVisible;

						return (
							<div
								key={index}
								onClick={() => {
									if (day) onDateClick(day);
								}}
								className={`bg-white p-2 flex flex-col transition-colors relative group
									${day ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-50/50"}`}
							>
								{day && (
									<>
										<div className="flex justify-center mb-1">
											<span
												className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full
													${isCurrentToday ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-700"}`}
											>
												{day}
											</span>
										</div>
										{/* Booking chips */}
										<div className="space-y-1 mt-1 overflow-hidden">
											{visibleBookings.map((booking) => (
												<div
													key={booking.id}
													className={`text-[9px] px-1.5 py-0.5 rounded truncate ${
														booking.status === "pending"
															? "bg-yellow-500 text-white"
															: CONFERENCE_ROOM_COLORS[booking.roomKey].chip
													}`}
													title={booking.purpose}
												>
													{booking.purpose}
												</div>
											))}
											{overflowCount > 0 && (
												<div className="text-[9px] px-1.5 py-0.5 text-gray-500 font-medium">
													+{overflowCount} more
												</div>
											)}
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
