"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
	dayNames,
	formatDayName,
	formatFullDate,
	getCalendarDays,
	isSameDay,
	monthNames,
} from "@/utils/date-utils";
import { generateTimeSlots } from "@/utils/time-utils";

export function RoomBookingCalendar() {
	const today = useMemo(() => new Date(), []);
	const [currentDate, setCurrentDate] = useState(today);
	const [selectedDate, setSelectedDate] = useState(today);

	const days = useMemo(() => getCalendarDays(currentDate), [currentDate]);
	const timeSlots = useMemo(() => generateTimeSlots(), []);

	const handlePrevMonth = () =>
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
	const handleNextMonth = () =>
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);

	const handleDateClick = (day: number) => {
		setSelectedDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
		);
	};

	const handleToday = () => {
		setCurrentDate(today);
		setSelectedDate(today);
	};

	// Shared Nav Logic
	const adjustDay = (amount: number) => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + amount);
		setSelectedDate(newDate);
		setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
	};

	return (
		<div className="flex gap-6 p-6 h-screen max-h-screen overflow-hidden">
			{/* Left Side - Calendar (Static Height) */}
			<div className="w-90 shrink-0">
				<div className="bg-white rounded-lg border-2 border-gray-300 shadow-sm p-4">
					<div className="flex items-center justify-between mb-4">
						<button
							type="button"
							onClick={handlePrevMonth}
							className="p-1 hover:bg-gray-100 rounded"
						>
							<ChevronLeft className="w-5 h-5 text-gray-600" />
						</button>
						<span className="text-sm font-medium text-gray-900">
							{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
						</span>
						<button
							type="button"
							onClick={handleNextMonth}
							className="p-1 hover:bg-gray-100 rounded"
						>
							<ChevronRight className="w-5 h-5 text-gray-600" />
						</button>
					</div>

					<div className="grid grid-cols-7 gap-1 mb-2">
						{dayNames.map((day) => (
							<div
								key={day}
								className="text-center text-xs font-medium text-gray-500 py-1"
							>
								{day}
							</div>
						))}
					</div>

					<div className="grid grid-cols-7 gap-1">
						{days.map((day, index) => {
							if (day === null)
								return (
									<div
										key={`empty-${index}`}
										className="invisible aspect-square"
									/>
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
									key={`${currentDate.getMonth()}-${day}`}
									type="button"
									onClick={() => handleDateClick(day)}
									className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                    ${
											isCurrentToday
												? "bg-red-600 text-white font-semibold hover:bg-red-700"
												: isCurrentSelected
													? "bg-gray-100 text-gray-900 font-medium"
													: "text-gray-700 hover:bg-gray-50"
										}`}
								>
									{day}
								</button>
							);
						})}
					</div>

					<div className="mt-6 space-y-2 border-t pt-4">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 bg-blue-500 rounded" />
							<span className="text-sm text-gray-700">Confirmed</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 bg-orange-400 rounded" />
							<span className="text-sm text-gray-700">Pending</span>
						</div>
					</div>
				</div>
			</div>

			{/* Right Side - Day View (Scrollable Container) */}
			<div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
				{/* Sticky Header */}
				<div className="shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => adjustDay(-1)}
								className="p-1 hover:bg-gray-100 rounded"
							>
								<ChevronLeft className="w-5 h-5 text-gray-600" />
							</button>
							<button
								type="button"
								onClick={() => adjustDay(1)}
								className="p-1 hover:bg-gray-100 rounded"
							>
								<ChevronRight className="w-5 h-5 text-gray-600" />
							</button>
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								{formatFullDate(selectedDate)}
							</h2>
							<p className="text-sm text-gray-500">
								{formatDayName(selectedDate)}
							</p>
						</div>
					</div>
					<Button
						type="button"
						onClick={handleToday}
						variant="outline"
						size="sm"
					>
						Today
					</Button>
				</div>

				{/* Scrollable Area */}
				<div className="flex-1 overflow-y-auto divide-y divide-gray-100">
					{timeSlots.map((slot) => (
						<button
							key={slot.time}
							type="button"
							className="flex items-center p-6 hover:bg-gray-50 transition-colors w-full text-left min-h-20"
						>
							<span className="w-24 text-sm font-medium text-gray-500 uppercase">
								{slot.time}
							</span>
							<div className="flex-1 h-full border-l border-gray-100 ml-4" />
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
