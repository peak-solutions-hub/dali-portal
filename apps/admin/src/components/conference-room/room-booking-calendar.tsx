"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	dayNames,
	formatDayName,
	formatFullDate,
	getCalendarDays,
	isSameDay,
	monthNames,
} from "@/utils/date-utils";
import { generateTimeSlots } from "@/utils/time-utils";
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
		setIsDragging(true);
		setDragStartIndex(index);
		setDragEndIndex(index);
		setSelectedSlots([index]);
	};

	const handleMouseEnter = (index: number) => {
		if (isDragging && dragStartIndex !== null) {
			setDragEndIndex(index);
			const start = Math.min(dragStartIndex, index);
			const end = Math.max(dragStartIndex, index);
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
							{/* Header */}
							<div className="mb-6">
								<h2 className="text-2xl font-bold text-gray-900 mb-1">
									Conference Room Booking
								</h2>
								<p className="text-sm text-gray-500">
									View bookings and create new reservations
								</p>
							</div>

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

									return (
										<button
											key={day}
											onClick={() => handleDateClick(day)}
											className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                        ${
													isCurrentToday
														? "bg-red-600 text-white font-bold"
														: isCurrentSelected
															? "bg-gray-900 text-white"
															: "text-gray-600 hover:bg-gray-100"
												}`}
										>
											{day}
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

								{timeSlots.map((slot, index) => (
									<button
										key={`${slot.time}-${index}`}
										onMouseDown={() => handleMouseDown(index)}
										onMouseEnter={() => handleMouseEnter(index)}
										onMouseUp={handleMouseUp}
										className={`group flex items-start p-0 w-full text-left h-20 border-b border-gray-50 transition-colors ${
											isSlotSelected(index)
												? "bg-blue-100 border-l-4 border-l-blue-600"
												: "hover:bg-gray-50/50"
										}`}
									>
										<div className="w-24 px-6 pt-1 text-[11px] font-black text-gray-300 group-hover:text-blue-500">
											{slot.time}
										</div>
										<div className="flex-1 h-full border-l border-gray-100" />
									</button>
								))}
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
											<div className="flex justify-center mb-1">
												<span
													className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full
                          ${isCurrentToday ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-700"}`}
												>
													{day}
												</span>
											</div>
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
