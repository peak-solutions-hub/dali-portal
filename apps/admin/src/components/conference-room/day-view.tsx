"use client";

import { CONFERENCE_ROOM_COLORS } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useDragSelect } from "@/hooks/room-booking";
import type { CalendarBooking } from "@/utils/booking-helpers";
import { formatDayName, formatFullDate, isSameDay } from "@/utils/date-utils";
import {
	generateTimeSlots,
	isTimeSlotBooked,
	type TimeSlot,
} from "@/utils/time-utils";

interface DayViewProps {
	selectedDate: Date;
	today: Date;
	now: Date;
	canCreateBookings: boolean;
	bookings: CalendarBooking[];
	isLoading: boolean;
	timeLinePosition: number | null;
	onPrevDay: () => void;
	onNextDay: () => void;
	onToday: () => void;
	onSwitchToMonth: () => void;
	onSelectTimeRange: (timeRange: string) => void;
	onViewBooking: (booking: CalendarBooking) => void;
}

export function DayView({
	selectedDate,
	today,
	now,
	canCreateBookings,
	bookings,
	isLoading,
	timeLinePosition,
	onPrevDay,
	onNextDay,
	onToday,
	onSwitchToMonth,
	onSelectTimeRange,
	onViewBooking,
}: DayViewProps) {
	const timeSlots = useMemo(() => generateTimeSlots(15), []);

	const {
		isDragging,
		dragPreviewTime,
		dragStartIndex,
		dragEndIndex,
		handleMouseDown,
		handleMouseEnter,
		handleMouseUp,
		isSlotSelected,
	} = useDragSelect({
		timeSlots,
		onSelectRange: onSelectTimeRange,
	});

	const getBookingForSlot = (index: number): CalendarBooking | null => {
		const slot = timeSlots[index];
		if (!slot) return null;

		return (
			bookings.find((booking) =>
				isTimeSlotBooked(
					slot.hour,
					slot.minute,
					booking.startTime,
					booking.endTime,
				),
			) ?? null
		);
	};

	const dragPreviewClassName = useMemo(() => {
		if (dragStartIndex === null || dragEndIndex === null) {
			return "bg-blue-600 text-white";
		}

		const start = Math.min(dragStartIndex, dragEndIndex);
		const end = Math.max(dragStartIndex, dragEndIndex);

		for (let i = start; i <= end; i++) {
			const booking = getBookingForSlot(i);
			if (!booking) continue;

			if (booking.status === "pending") {
				return "bg-yellow-500 text-white";
			}

			return CONFERENCE_ROOM_COLORS[booking.roomKey].chip;
		}

		return "bg-blue-600 text-white";
	}, [dragStartIndex, dragEndIndex, bookings, timeSlots]);

	return (
		<div
			className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
		>
			{/* Header */}
			<div className="shrink-0 flex items-center justify-between p-6 border-b border-gray-100 bg-white z-20">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
						<button
							onClick={onPrevDay}
							className="p-1.5 hover:bg-white hover:shadow-sm rounded-md"
						>
							<ChevronLeft className="w-4 h-4 text-gray-600" />
						</button>
						<button
							onClick={onNextDay}
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
					{!canCreateBookings && (
						<span className="text-xs font-medium text-gray-500">
							Past date (view only)
						</span>
					)}
					<Button onClick={onSwitchToMonth} variant="outline" size="sm">
						Month View
					</Button>
					<Button onClick={onToday} variant="outline" size="sm">
						Today
					</Button>
				</div>
			</div>

			{/* Time Grid */}
			<div className="flex-1 overflow-y-auto relative">
				{/* Loading overlay */}
				{isLoading && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
						<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
					</div>
				)}

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

					{/* Time Slot Rows */}
					{timeSlots.map((slot, index) => {
						const booking = getBookingForSlot(index);
						const slotIsBooked = booking !== null;
						const roomColors = booking
							? CONFERENCE_ROOM_COLORS[booking.roomKey]
							: null;
						const isSelected = isSlotSelected(index);

						const selectedClassName = isSelected
							? booking
								? booking.status === "pending"
									? "bg-yellow-100 border-l-4 border-l-yellow-500"
									: roomColors
										? `${roomColors.bg} border-l-4 ${roomColors.border}`
										: "bg-blue-100"
								: "bg-blue-100"
							: "";

						const bookedClassName =
							slotIsBooked && booking
								? booking.status === "pending"
									? "bg-yellow-50 border-l-4 border-l-yellow-500"
									: roomColors
										? roomColors.bg + " border-l-4 " + roomColors.border
										: "bg-blue-50 border-l-4 border-l-blue-500"
								: "bg-white";

						return (
							<div key={`${slot.time}-${index}`} className="relative">
								{/* Time label */}
								{slot.minute === 0 && slot.time && (
									<div className="absolute left-0 top-0 -translate-y-1/2 z-10 w-24 px-6 text-[11px] font-medium text-gray-400 pointer-events-none">
										{slot.time}
									</div>
								)}
								<button
									onMouseDown={() => {
										if (!canCreateBookings) return;
										handleMouseDown(index);
									}}
									onMouseEnter={() => {
										if (!canCreateBookings) return;
										handleMouseEnter(index);
									}}
									onMouseUp={handleMouseUp}
									className={`flex items-start p-0 w-full text-left h-5 ${
										slot.minute === 0 ? "border-t border-gray-100" : ""
									} transition-colors relative ${
										canCreateBookings ? "cursor-pointer" : "cursor-default"
									} ${isSelected ? selectedClassName : bookedClassName}`}
								/>
							</div>
						);
					})}

					{/* Booking Overlays */}
					{bookings.map((booking) => {
						const firstSlotIndex = timeSlots.findIndex((slot) =>
							isTimeSlotBooked(
								slot.hour,
								slot.minute,
								booking.startTime,
								booking.endTime,
							),
						);
						if (firstSlotIndex === -1) return null;

						// Count how many slots this booking spans
						let slotCount = 0;
						for (let i = firstSlotIndex; i < timeSlots.length; i++) {
							const slot = timeSlots[i];
							if (!slot) break;
							if (
								isTimeSlotBooked(
									slot.hour,
									slot.minute,
									booking.startTime,
									booking.endTime,
								)
							) {
								slotCount++;
							} else {
								break;
							}
						}

						const topPosition = firstSlotIndex * 20;
						const height = slotCount * 20;
						const roomColors = CONFERENCE_ROOM_COLORS[booking.roomKey];
						const isPending = booking.status === "pending";

						return (
							<button
								key={booking.id}
								type="button"
								onClick={() => onViewBooking(booking)}
								className="absolute left-24 right-0 z-20 text-left group/booking"
								style={{
									top: `${topPosition}px`,
									height: `${height}px`,
								}}
							>
								<div
									className={`h-full ml-px pl-4 flex flex-col justify-center gap-1 rounded-r-md group-hover/booking:brightness-95 transition-[filter] ${
										isPending ? "bg-yellow-50" : roomColors.bg
									}`}
								>
									<div className="flex items-center gap-2">
										<span
											className={`text-xs font-semibold ${
												isPending ? "text-yellow-700" : roomColors.text
											}`}
										>
											{booking.purpose}
										</span>
										<span
											className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
												isPending
													? "bg-yellow-100 text-yellow-700"
													: roomColors.label
											}`}
										>
											{booking.status}
										</span>
										<span className="text-[10px] text-gray-400">
											{booking.room}
										</span>
									</div>
									<span className="text-[10px] text-gray-500">
										{booking.startTime} - {booking.endTime}
									</span>
								</div>
							</button>
						);
					})}

					{/* Drag Preview */}
					{isDragging &&
						dragPreviewTime &&
						dragStartIndex !== null &&
						dragEndIndex !== null && (
							<div
								className="absolute left-24 right-0 pointer-events-none z-40"
								style={{
									top: `${Math.min(dragStartIndex, dragEndIndex) * 20}px`,
									height: `${(Math.abs(dragEndIndex - dragStartIndex) + 1) * 20}px`,
								}}
							>
								<div className="h-full ml-px pl-4 flex items-center">
									<div
										className={`px-3 py-1.5 rounded-lg shadow-lg font-medium text-sm ${dragPreviewClassName}`}
									>
										{dragPreviewTime}
									</div>
								</div>
							</div>
						)}
				</div>
			</div>
		</div>
	);
}
