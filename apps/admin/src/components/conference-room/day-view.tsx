"use client";

import { Button } from "@repo/ui/components/button";
import {
	ChevronLeft,
	ChevronRight,
	Clock,
	Loader2,
	MapPin,
} from "lucide-react";
import { useMemo } from "react";
import { useDragSelect } from "@/hooks/room-booking";
import { CONFERENCE_ROOM_COLORS } from "@/utils/booking-color-utils";
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
						const roomColors = booking
							? CONFERENCE_ROOM_COLORS[booking.roomKey]
							: null;
						const isSelected = isSlotSelected(index);

						const selectedClassName = isSelected
							? booking
								? booking.status === "pending"
									? "bg-yellow-100 border-l-4 border-l-yellow-500"
									: roomColors
										? `bg-gray-200 border-l-4 ${roomColors.border}`
										: "bg-blue-100"
								: "bg-blue-100"
							: "";

						const bookedClassName = "bg-white";

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
					{(() => {
						// 1. Map bookings to their absolute start and end indices
						const layoutBookings = bookings
							.map((booking) => {
								const firstSlotIndex = timeSlots.findIndex((slot) =>
									isTimeSlotBooked(
										slot.hour,
										slot.minute,
										booking.startTime,
										booking.endTime,
									),
								);

								if (firstSlotIndex === -1) return null;

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

								return {
									booking,
									startIndex: firstSlotIndex,
									endIndex: firstSlotIndex + slotCount - 1,
								};
							})
							.filter((b): b is NonNullable<typeof b> => b !== null)
							// 2. Sort by start index, then descending by end index
							.sort((a, b) => {
								if (a.startIndex !== b.startIndex) {
									return a.startIndex - b.startIndex;
								}
								return b.endIndex - a.endIndex;
							});

						// 3. Group and assign columns
						const processedBookings = [];
						let currentGroup: typeof layoutBookings = [];
						let maxGroupEnd = -1;

						for (const b of layoutBookings) {
							if (currentGroup.length === 0) {
								currentGroup.push(b);
								maxGroupEnd = b.endIndex;
							} else if (b.startIndex <= maxGroupEnd) {
								// Overlaps with the current group
								currentGroup.push(b);
								maxGroupEnd = Math.max(maxGroupEnd, b.endIndex);
							} else {
								// Calculate columns for the previous group
								const columns: (typeof layoutBookings)[] = [];
								for (const gb of currentGroup) {
									let placed = false;
									for (const col of columns) {
										const lastInCol = col[col.length - 1];
										if (lastInCol && gb.startIndex > lastInCol.endIndex) {
											col.push(gb);
											placed = true;
											break;
										}
									}
									if (!placed) {
										columns.push([gb]);
									}
								}

								const numCols = columns.length;
								for (let c = 0; c < numCols; c++) {
									for (const gb of columns[c]!) {
										processedBookings.push({
											...gb,
											column: c,
											totalColumns: numCols,
										});
									}
								}

								// Start new group
								currentGroup = [b];
								maxGroupEnd = b.endIndex;
							}
						}

						// Process the last group
						if (currentGroup.length > 0) {
							const columns: (typeof layoutBookings)[] = [];
							for (const gb of currentGroup) {
								let placed = false;
								for (const col of columns) {
									const lastInCol = col[col.length - 1];
									if (lastInCol && gb.startIndex > lastInCol.endIndex) {
										col.push(gb);
										placed = true;
										break;
									}
								}
								if (!placed) {
									columns.push([gb]);
								}
							}

							const numCols = columns.length;
							for (let c = 0; c < numCols; c++) {
								for (const gb of columns[c]!) {
									processedBookings.push({
										...gb,
										column: c,
										totalColumns: numCols,
									});
								}
							}
						}

						// 4. Render
						return processedBookings.map(
							({ booking, startIndex, endIndex, column, totalColumns }) => {
								const topPosition = startIndex * 20;
								const height = (endIndex - startIndex + 1) * 20;
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

								const widthPercentage = 100 / totalColumns;
								const leftPercentage = column * widthPercentage;

								return (
									<button
										key={booking.id}
										type="button"
										onClick={() => onViewBooking(booking)}
										className="absolute z-20 text-left group/booking"
										style={{
											top: `${topPosition}px`,
											height: `${height}px`,
											// Keep it pinned to right bounds of its relative column
											left: `calc(6rem + calc(calc(100% - 6rem) * ${leftPercentage / 100}))`,
											width: `calc(calc(100% - 6rem) * ${widthPercentage / 100} - 4px)`,
										}}
									>
										<div
											className={`h-full ml-px ${
												height <= 20 ? "pl-2" : "pl-2 md:pl-4"
											} flex flex-col justify-center gap-0.5 md:gap-1 rounded-r-md group-hover/booking:brightness-95 transition-[filter] shadow-sm overflow-hidden ${containerBg}`}
										>
											{height <= 20 ? (
												<div className="flex items-center gap-2 truncate pr-2 w-full">
													<span className="text-[10px] font-bold text-white truncate shrink-0">
														{booking.purpose}
													</span>
													<div className="flex items-center gap-1 text-[9px] text-white/90 min-w-0">
														<MapPin className="w-2.5 h-2.5 shrink-0 opacity-80" />
														<span className="truncate max-w-[80px]">
															{booking.room}
														</span>
														<Clock className="w-2.5 h-2.5 shrink-0 opacity-80 ml-1" />
														<span className="truncate whitespace-nowrap">
															{booking.startTime} - {booking.endTime}
														</span>
													</div>
												</div>
											) : height <= 40 ? (
												<>
													<div className="flex items-center truncate pr-2 w-full">
														<span className="text-[11px] font-bold text-white truncate leading-tight">
															{booking.purpose}
														</span>
													</div>
													<div className="flex items-center gap-2 text-[9px] md:text-[10px] text-white/90 truncate pr-2 w-full">
														<div className="flex items-center gap-1 shrink-0 min-w-0">
															<MapPin className="w-3 h-3 shrink-0 opacity-80" />
															<span className="truncate max-w-[100px]">
																{booking.room}
															</span>
														</div>
														<div className="flex items-center gap-1 shrink-0 min-w-0">
															<Clock className="w-3 h-3 shrink-0 opacity-80" />
															<span className="truncate">
																{booking.startTime} - {booking.endTime}
															</span>
														</div>
													</div>
												</>
											) : (
												<>
													<div className="flex items-center gap-1 md:gap-2 truncate pr-2 w-full">
														<span className="text-xs font-bold text-white truncate">
															{booking.purpose}
														</span>
													</div>
													<div className="flex flex-col gap-0.5 text-[9px] md:text-[10px] text-white/90 w-full">
														<div className="flex items-center gap-1 min-w-0">
															<MapPin className="w-3 h-3 shrink-0 opacity-80" />
															<span className="truncate">{booking.room}</span>
														</div>
														<div className="flex items-center gap-1 min-w-0 pr-2">
															<Clock className="w-3 h-3 shrink-0 opacity-80" />
															<span className="truncate">
																{booking.startTime} - {booking.endTime}
															</span>
														</div>
													</div>
												</>
											)}
										</div>
									</button>
								);
							},
						);
					})()}

					{/* Drag Preview */}
					{isDragging &&
						dragPreviewTime &&
						dragStartIndex !== null &&
						dragEndIndex !== null && (
							<div
								className="absolute left-[6rem] w-[calc(100%-6rem)] pointer-events-none z-40"
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
