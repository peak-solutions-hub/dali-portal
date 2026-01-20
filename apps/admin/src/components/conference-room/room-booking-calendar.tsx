"use client";

import { Button } from "@repo/ui/components/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	dayNames,
	formatDayName,
	formatFullDate,
	getCalendarDays,
	isSameDay,
	monthNames,
} from "@/utils/date-utils";
import {
	generateTimeSlots,
	isTimeSlotBooked,
	parseTimeToHour,
} from "@/utils/time-utils";
import { BookingModal } from "./booking-modal";

export function RoomBookingCalendar() {
	const today = useMemo(() => new Date(), []);
	const [currentDate, setCurrentDate] = useState(today);
	const [selectedDate, setSelectedDate] = useState(today);
	const [viewMode, setViewMode] = useState<"day" | "month">("day");
	const [now, setNow] = useState(new Date());
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
	const [dragEndIndex, setDragEndIndex] = useState<number | null>(null);
	const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

	// Mock bookings data
	const mockBookings = useMemo(
		() => [
			{
				id: "1",
				date: new Date(2026, 0, 21), // January 21, 2026
				startTime: "9:00 AM",
				endTime: "11:00 AM",
				room: "Conference Room A",
				purpose: "Team Planning Meeting",
				attendees: 15,
				status: "confirmed" as const,
			},
			{
				id: "2",
				date: new Date(2026, 0, 21), // January 21, 2026
				startTime: "2:00 PM",
				endTime: "4:00 PM",
				room: "Conference Room A",
				purpose: "Budget Review Session",
				attendees: 8,
				status: "pending" as const,
			},
		],
		[],
	);

	// Check if selected date has bookings
	const hasBookingsForSelectedDate = useMemo(() => {
		return mockBookings.some((booking) =>
			isSameDay(booking.date, selectedDate),
		);
	}, [mockBookings, selectedDate]);

	// Get bookings for selected date
	const bookingsForSelectedDate = useMemo(() => {
		return mockBookings.filter((booking) =>
			isSameDay(booking.date, selectedDate),
		);
	}, [mockBookings, selectedDate]);

	// Update time for the red indicator line
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	const days = useMemo(() => getCalendarDays(currentDate), [currentDate]);
	const timeSlots = useMemo(() => generateTimeSlots(), []);

	// Calculate position for the red line (Current Time)
	// Position is calculated as a percentage of the full day (1440 minutes)
	// This ensures accurate positioning down to the minute
	const timeLinePosition = useMemo(() => {
		if (!isSameDay(selectedDate, today)) return null;
		const totalMinutes = now.getHours() * 60 + now.getMinutes();
		// Calculate percentage: current minutes / total minutes in day * 100
		return (totalMinutes / 1440) * 100;
	}, [selectedDate, now, today]);

	const handlePrevMonth = () =>
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
	const handleNextMonth = () =>
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);

	const handleDateClick = (day: number) => {
		const newDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			day,
		);
		setSelectedDate(newDate);
		// Open modal when clicking from month view
		if (viewMode === "month") {
			setSelectedTimeSlot("");
			setIsModalOpen(true);
		}
	};

	const handleToday = () => {
		setCurrentDate(today);
		setSelectedDate(today);
	};

	const adjustDay = (amount: number) => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + amount);
		setSelectedDate(newDate);
		if (newDate.getMonth() !== currentDate.getMonth()) {
			setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
		}
	};

	const handleMouseDown = (index: number) => {
		// Prevent selecting booked slots
		if (isSlotBooked(index)) return;

		setIsDragging(true);
		setDragStartIndex(index);
		setDragEndIndex(index);
		setSelectedSlots([index]);
	};

	const handleMouseEnter = (index: number) => {
		if (isDragging && dragStartIndex !== null) {
			// Don't allow dragging over booked slots
			if (isSlotBooked(index)) return;

			setDragEndIndex(index);
			const start = Math.min(dragStartIndex, index);
			const end = Math.max(dragStartIndex, index);

			// Check if any slot in the range is booked
			if (isRangeBooked(start, end)) return;

			const slots = [];
			for (let i = start; i <= end; i++) {
				slots.push(i);
			}
			setSelectedSlots(slots);
		}
	};

	const handleMouseUp = () => {
		if (isDragging && dragStartIndex !== null && dragEndIndex !== null) {
			setIsDragging(false);

			const start = Math.min(dragStartIndex, dragEndIndex);
			const end = Math.max(dragStartIndex, dragEndIndex);

			// Get start and end times
			const startSlot = timeSlots[start];
			const endSlot = timeSlots[end];

			if (!startSlot || !endSlot) return;

			const startTime = startSlot.time || "12 AM";
			const endHour = (endSlot.hour + 1) % 24;

			// Format end time
			const endPeriod = endHour < 12 ? "AM" : "PM";
			const endDisplay =
				endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
			const endTime = `${endDisplay} ${endPeriod}`;

			setSelectedTimeSlot(`${startTime} - ${endTime}`);
			setIsModalOpen(true);

			// Reset selection
			setDragStartIndex(null);
			setDragEndIndex(null);
			setSelectedSlots([]);
		}
	};

	const isSlotSelected = (index: number) => {
		return selectedSlots.includes(index);
	};

	// Check if a time slot is already booked
	const isSlotBooked = (index: number): boolean => {
		const slot = timeSlots[index];
		if (!slot?.time) return false;

		const slotHour = slot.hour;

		return bookingsForSelectedDate.some((booking) => {
			return isTimeSlotBooked(slotHour, booking.startTime, booking.endTime);
		});
	};

	// Check if any slot in a range is booked
	const isRangeBooked = (startIndex: number, endIndex: number): boolean => {
		for (let i = startIndex; i <= endIndex; i++) {
			if (isSlotBooked(i)) return true;
		}
		return false;
	};

	return (
		<div
			className="flex gap-6 p-6 h-screen max-h-screen overflow-hidden bg-gray-50"
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
		>
			{viewMode === "day" ? (
				<>
					{/* Left Side - Sidebar Calendar */}
					<div className="w-96 shrink-0">
						<div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
							{/* Calendar Navigation */}
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-gray-900">
									{monthNames[currentDate.getMonth()]}{" "}
									{currentDate.getFullYear()}
								</h3>
								<div className="flex gap-1">
									<button
										onClick={handlePrevMonth}
										className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
									>
										<ChevronLeft className="w-4 h-4 text-gray-600" />
									</button>
									<button
										onClick={handleNextMonth}
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
										return (
											<div key={`empty-${index}`} className="aspect-square" />
										);
									const dateAtSlot = new Date(
										currentDate.getFullYear(),
										currentDate.getMonth(),
										day,
									);
									const isCurrentToday = isSameDay(dateAtSlot, today);
									const isCurrentSelected = isSameDay(dateAtSlot, selectedDate);
									const hasBooking = mockBookings.some((booking) =>
										isSameDay(booking.date, dateAtSlot),
									);

									return (
										<button
											key={day}
											onClick={() => handleDateClick(day)}
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
									<div className="w-4 h-4 bg-blue-600 rounded" />
									<span className="text-sm text-gray-700">Confirmed</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-4 h-4 bg-yellow-500 rounded" />
									<span className="text-sm text-gray-700">Pending</span>
								</div>
							</div>

							{/* Bookings for Selected Date */}
							{hasBookingsForSelectedDate ? (
								<div className="mt-6 pt-4 border-t border-gray-200">
									<h4 className="text-sm font-semibold text-gray-900 mb-3">
										Bookings for {formatFullDate(selectedDate)}
									</h4>
									<div className="space-y-3">
										{bookingsForSelectedDate.map((booking) => (
											<div
												key={booking.id}
												className={`p-3 rounded-lg border ${
													booking.status === "confirmed"
														? "bg-blue-50 border-blue-200"
														: "bg-yellow-50 border-yellow-200"
												}`}
											>
												<div className="flex items-start justify-between mb-2">
													<p className="text-sm font-semibold text-gray-900">
														{booking.startTime} - {booking.endTime}
													</p>
													<span
														className={`text-xs px-2 py-0.5 rounded-full font-medium ${
															booking.status === "confirmed"
																? "bg-blue-100 text-blue-700"
																: "bg-yellow-100 text-yellow-700"
														}`}
													>
														{booking.status}
													</span>
												</div>
												<p className="text-xs text-gray-600 mb-1">
													{booking.purpose}
												</p>
												<p className="text-xs text-gray-500">
													{booking.attendees} attendees
												</p>
											</div>
										))}
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

					{/* Right Side - Day View */}
					<div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
						<div className="shrink-0 flex items-center justify-between p-6 border-b border-gray-100 bg-white z-20">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
									<button
										onClick={() => adjustDay(-1)}
										className="p-1.5 hover:bg-white hover:shadow-sm rounded-md"
									>
										<ChevronLeft className="w-4 h-4 text-gray-600" />
									</button>
									<button
										onClick={() => adjustDay(1)}
										className="p-1.5 hover:bg-white hover:shadow-sm rounded-md"
									>
										<ChevronRight className="w-4 h-4 text-gray-600" />
									</button>
								</div>
								<div>
									<h2 className="text-xl font-bold text-gray-900">
										{formatFullDate(selectedDate)}
									</h2>
									<p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
										{formatDayName(selectedDate)}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									onClick={() => setViewMode("month")}
									variant="outline"
									size="sm"
								>
									Month View
								</Button>
								<Button onClick={handleToday} variant="outline" size="sm">
									Today
								</Button>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto relative">
							{/* Time Slots - Complete 24 hours (12 AM to 11 PM) */}
							<div className="relative">
								{/* Real-time Indicator Line */}
								{timeLinePosition !== null && (
									<div
										className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
										style={{ top: `${timeLinePosition}%` }}
									>
										<div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
										<div className="flex-1 h-0.5 bg-red-500" />
										<div className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full mr-4 font-bold shadow-sm">
											{now.toLocaleTimeString("en-US", {
												hour: "2-digit",
												minute: "2-digit",
												hour12: true,
											})}
										</div>
									</div>
								)}

								{timeSlots.map((slot, index) => {
									const slotIsBooked = isSlotBooked(index);
									const booking = slotIsBooked
										? bookingsForSelectedDate.find((b) => {
												return isTimeSlotBooked(
													slot.hour,
													b.startTime,
													b.endTime,
												);
											})
										: null;

									return (
										<button
											key={`${slot.time}-${index}`}
											onMouseDown={() => handleMouseDown(index)}
											onMouseEnter={() => handleMouseEnter(index)}
											onMouseUp={handleMouseUp}
											disabled={slotIsBooked}
											className={`group flex items-start p-0 w-full text-left h-20 border-b border-gray-50 transition-colors relative ${
												slotIsBooked
													? booking?.status === "confirmed"
														? "bg-blue-50 border-l-4 border-l-blue-600 cursor-not-allowed"
														: "bg-yellow-50 border-l-4 border-l-yellow-500 cursor-not-allowed"
													: isSlotSelected(index)
														? "bg-blue-100 border-l-4 border-l-blue-600"
														: "hover:bg-gray-50/50 cursor-pointer"
											}`}
										>
											<div
												className={`w-24 px-6 pt-1 text-[11px] font-black ${
													slotIsBooked
														? booking?.status === "confirmed"
															? "text-blue-600"
															: "text-yellow-600"
														: "text-gray-300 group-hover:text-blue-500"
												}`}
											>
												{slot.time}
											</div>
											<div className="flex-1 h-full border-l border-gray-100 px-4 pt-1">
												{slotIsBooked && booking && (
													<div className="flex flex-col gap-1">
														<div className="flex items-center gap-2">
															<span
																className={`text-xs font-semibold ${
																	booking.status === "confirmed"
																		? "text-blue-700"
																		: "text-yellow-700"
																}`}
															>
																{booking.purpose}
															</span>
															<span
																className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
																	booking.status === "confirmed"
																		? "bg-blue-100 text-blue-700"
																		: "bg-yellow-100 text-yellow-700"
																}`}
															>
																{booking.status}
															</span>
														</div>
														<span className="text-[10px] text-gray-500">
															{booking.startTime} - {booking.endTime}
														</span>
													</div>
												)}
											</div>
										</button>
									);
								})}
							</div>
						</div>
					</div>
				</>
			) : (
				/* CLEAN SQUARE MONTH VIEW */
				<div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
					<div className="shrink-0 flex items-center justify-between p-6 border-b border-gray-100 bg-white">
						<div className="flex items-center gap-4">
							<h2 className="text-xl font-bold text-gray-900">
								{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
							</h2>
							<div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
								<button
									onClick={handlePrevMonth}
									className="p-2 hover:bg-gray-50 border-r border-gray-200"
								>
									<ChevronLeft className="w-4 h-4 text-gray-600" />
								</button>
								<button
									onClick={handleNextMonth}
									className="p-2 hover:bg-gray-50"
								>
									<ChevronRight className="w-4 h-4 text-gray-600" />
								</button>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								onClick={() => setViewMode("day")}
								variant="outline"
								size="sm"
							>
								Day View
							</Button>
							<Button onClick={handleToday} variant="outline" size="sm">
								Today
							</Button>
						</div>
					</div>

					<div className="flex-1 flex flex-col overflow-hidden">
						{/* Headers */}
						<div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
							{["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
								<div
									key={day}
									className="py-2 text-center text-[10px] font-bold text-gray-400 tracking-widest border-r border-gray-100 last:border-r-0"
								>
									{day}
								</div>
							))}
						</div>

						{/* Grid */}
						<div className="flex-1 grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
							{days.map((day, index) => {
								const dateAtSlot = day
									? new Date(
											currentDate.getFullYear(),
											currentDate.getMonth(),
											day,
										)
									: null;
								const isCurrentToday = dateAtSlot
									? isSameDay(dateAtSlot, today)
									: false;

								// Get bookings for this date
								const dayBookings = dateAtSlot
									? mockBookings.filter((booking) =>
											isSameDay(booking.date, dateAtSlot),
										)
									: [];

								return (
									<div
										key={index}
										onClick={() => {
											if (day) {
												handleDateClick(day);
											}
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
												{/* Bookings for this day */}
												<div className="space-y-1 mt-1 overflow-hidden">
													{dayBookings.map((booking) => (
														<div
															key={booking.id}
															className={`text-[9px] px-1.5 py-0.5 rounded truncate ${
																booking.status === "confirmed"
																	? "bg-blue-600 text-white"
																	: "bg-yellow-500 text-white"
															}`}
															title={booking.purpose}
														>
															{booking.purpose}
														</div>
													))}
												</div>
											</>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			<BookingModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				selectedTime={selectedTimeSlot}
				selectedDate={formatFullDate(selectedDate)}
			/>
		</div>
	);
}
