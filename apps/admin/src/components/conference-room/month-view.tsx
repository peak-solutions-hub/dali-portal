"use client";

import { dayNames, getCalendarDays, isSameDay, monthNames } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { CONFERENCE_ROOM_COLORS } from "@repo/ui/lib/conference-room-colors";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import type { CalendarBooking } from "@/utils/booking-helpers";

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
	onDateNumberClick: (day: number) => void;
	onViewBooking: (booking: CalendarBooking) => void;
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
	onDateNumberClick,
	onViewBooking,
}: MonthViewProps) {
	const days = getCalendarDays(currentDate);
	const [expandedDate, setExpandedDate] = useState<Date | null>(null);

	const handlePopoverClose = (e: React.MouseEvent) => {
		e.stopPropagation();
		setExpandedDate(null);
	};

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

			<div className="flex-1 flex flex-col">
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
						const maxVisible = 2;
						const visibleBookings = dayBookings.slice(0, maxVisible);
						const overflowCount = dayBookings.length - maxVisible;

						const isExpanded =
							expandedDate && dateAtSlot
								? isSameDay(expandedDate, dateAtSlot)
								: false;

						return (
							<div
								key={index}
								onClick={() => {
									if (day) onDateClick(day);
								}}
								className={`bg-white p-2 min-h-30 flex flex-col transition-colors relative 
									${day ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-50/50"}`}
							>
								{day && dateAtSlot && (
									<>
										<div className="flex justify-center mb-1">
											<button
												type="button"
												className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors 
													${isCurrentToday ? "bg-blue-600 text-white shadow-md shadow-blue-100 hover:bg-blue-700" : "text-gray-700 hover:text-blue-600"}`}
												onClick={(e) => {
													e.stopPropagation();
													onDateNumberClick(day);
												}}
											>
												{day}
											</button>
										</div>

										{/* Booking chips */}
										<div className="space-y-1 mt-1">
											{visibleBookings.map((booking) => {
												const meetingTypeDisplay =
													booking.meetingType === "others" &&
													booking.meetingTypeOthers
														? `Others: ${booking.meetingTypeOthers}`
														: booking.meetingTypeLabel;
												const isDone =
													booking.isPast && booking.status === "confirmed";
												const isExpired =
													booking.isPast && booking.status === "pending";
												const isPending =
													!booking.isPast && booking.status === "pending";

												const containerBg = isDone
													? "bg-gray-400 text-white border border-transparent"
													: isExpired
														? "bg-red-400 text-white border border-transparent"
														: isPending
															? "bg-[#f6bf26] text-white border border-transparent"
															: CONFERENCE_ROOM_COLORS[booking.roomKey]?.chip ||
																"bg-gray-200";

												return (
													<button
														type="button"
														key={booking.id}
														onClick={(e) => {
															e.stopPropagation();
															onViewBooking(booking);
														}}
														className={`w-full text-left text-[9px] px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity ${containerBg}`}
														title={`${booking.purpose} • ${meetingTypeDisplay}`}
													>
														{booking.purpose} • {meetingTypeDisplay}
													</button>
												);
											})}
											{overflowCount > 0 && (
												<Popover
													open={isExpanded}
													onOpenChange={(isOpen) => {
														if (isOpen) setExpandedDate(dateAtSlot);
														else if (isExpanded) setExpandedDate(null);
													}}
												>
													<PopoverTrigger asChild>
														<button
															type="button"
															className="text-[10px] px-1.5 py-0.5 text-gray-500 font-medium hover:bg-gray-100 rounded w-full text-left focus:outline-none"
															onClick={(e) => e.stopPropagation()}
														>
															+{overflowCount} more
														</button>
													</PopoverTrigger>
													<PopoverContent
														className="w-56 p-0 shadow-xl rounded-xl border border-gray-200 z-100 overflow-hidden"
														align="start"
														sideOffset={4}
													>
														<div className="bg-gray-50 p-3 border-b border-gray-100 flex items-start justify-between">
															<div className="flex flex-col flex-1 items-center justify-center pt-1">
																<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
																	{dayNames[dateAtSlot.getDay()]?.slice(0, 3)}
																</span>
																<span
																	className={`text-2xl font-normal leading-none ${
																		isCurrentToday
																			? "text-blue-600"
																			: "text-gray-900"
																	}`}
																>
																	{day}
																</span>
															</div>
															<button
																onClick={handlePopoverClose}
																className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
															>
																<X className="w-4 h-4" />
															</button>
														</div>
														<div className="p-2 space-y-1 max-h-62.5 overflow-y-auto">
															{dayBookings.map((booking) => {
																const meetingTypeDisplay =
																	booking.meetingType === "others" &&
																	booking.meetingTypeOthers
																		? `Others: ${booking.meetingTypeOthers}`
																		: booking.meetingTypeLabel;
																const isDone =
																	booking.isPast &&
																	booking.status === "confirmed";
																const isExpired =
																	booking.isPast &&
																	booking.status === "pending";
																const isPending =
																	!booking.isPast &&
																	booking.status === "pending";

																const containerBg = isDone
																	? "bg-gray-400 text-white border border-transparent"
																	: isExpired
																		? "bg-red-400 text-white border border-transparent"
																		: isPending
																			? "bg-[#f6bf26] text-white border border-transparent"
																			: CONFERENCE_ROOM_COLORS[booking.roomKey]
																					?.chip || "bg-gray-200";

																return (
																	<button
																		type="button"
																		key={`expanded-${booking.id}`}
																		onClick={(e) => {
																			e.stopPropagation();
																			setExpandedDate(null);
																			onViewBooking(booking);
																		}}
																		className={`w-full text-left text-[11px] px-2 py-1.5 rounded font-medium hover:brightness-95 transition-[filter] ${containerBg}`}
																		title={`${booking.purpose} • ${meetingTypeDisplay}`}
																	>
																		<div className="truncate">
																			{booking.startTime} - {booking.purpose}
																		</div>
																		<div className="truncate text-[10px] opacity-90">
																			{meetingTypeDisplay}
																		</div>
																	</button>
																);
															})}
														</div>
													</PopoverContent>
												</Popover>
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
