"use client";

import { useEffect, useMemo, useState } from "react";
import { useRoomBookings } from "@/hooks/room-booking";
import {
	type CalendarBooking,
	getTimeLinePosition,
	mapApiBookings,
} from "@/utils/booking-helpers";
import { isSameDay } from "@/utils/date-utils";
import { CalendarSidebar } from "./calendar-sidebar";
import { CreateBookingModal } from "./create-booking-modal";
import { DayView } from "./day-view";
import { DeleteBookingDialog } from "./delete-booking-dialog";
import type { EditBookingData } from "./edit-booking-modal";
import { EditBookingModal } from "./edit-booking-modal";
import { MonthView } from "./month-view";
import { ViewBookingModal } from "./view-booking-modal";

export function RoomBookingCalendar() {
	const today = useMemo(() => new Date(), []);
	const [currentDate, setCurrentDate] = useState(today);
	const [selectedDate, setSelectedDate] = useState(today);
	const [viewMode, setViewMode] = useState<"day" | "month">("day");
	const [now, setNow] = useState(new Date());

	// Modal states
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
	const [viewingBooking, setViewingBooking] = useState<CalendarBooking | null>(
		null,
	);
	const [editingBooking, setEditingBooking] = useState<EditBookingData | null>(
		null,
	);
	const [deletingBooking, setDeletingBooking] = useState<{
		id: string;
		title: string;
	} | null>(null);

	// Fetch bookings from API
	const { data: bookingsData, isLoading: isBookingsLoading } =
		useRoomBookings(selectedDate);

	const bookingsForSelectedDate = useMemo(
		(): CalendarBooking[] =>
			bookingsData?.bookings ? mapApiBookings(bookingsData.bookings) : [],
		[bookingsData],
	);

	// Update time for the red indicator line
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	const timeLinePosition = useMemo(
		() => getTimeLinePosition(selectedDate, today, now),
		[selectedDate, now, today],
	);

	// --- Navigation handlers ---
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
		if (viewMode === "month") {
			setSelectedTimeSlot("");
			setIsCreateOpen(true);
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

	// --- Modal handlers ---
	const handleViewBooking = (booking: CalendarBooking) => {
		setViewingBooking(booking);
	};

	const handleEditFromView = (booking: CalendarBooking) => {
		setViewingBooking(null);
		setEditingBooking({
			id: booking.id,
			title: booking.purpose,
			requestedFor: booking.requestedFor,
			room: booking.roomKey,
			date: booking.date,
			startTime: booking.startTime24,
			endTime: booking.endTime24,
			attachmentUrl: booking.attachmentUrl,
		});
	};

	const handleDeleteFromView = (booking: CalendarBooking) => {
		setViewingBooking(null);
		setDeletingBooking({ id: booking.id, title: booking.purpose });
	};

	const handleSelectTimeRange = (timeRange: string) => {
		setSelectedTimeSlot(timeRange);
		setIsCreateOpen(true);
	};

	return (
		<div className="flex gap-6 p-6 h-screen max-h-screen overflow-hidden bg-gray-50">
			{viewMode === "day" ? (
				<>
					<CalendarSidebar
						currentDate={currentDate}
						selectedDate={selectedDate}
						today={today}
						bookings={bookingsForSelectedDate}
						onPrevMonth={handlePrevMonth}
						onNextMonth={handleNextMonth}
						onDateClick={handleDateClick}
						onViewBooking={handleViewBooking}
					/>
					<DayView
						selectedDate={selectedDate}
						today={today}
						now={now}
						bookings={bookingsForSelectedDate}
						isLoading={isBookingsLoading}
						timeLinePosition={timeLinePosition}
						onPrevDay={() => adjustDay(-1)}
						onNextDay={() => adjustDay(1)}
						onToday={handleToday}
						onSwitchToMonth={() => setViewMode("month")}
						onSelectTimeRange={handleSelectTimeRange}
						onViewBooking={handleViewBooking}
					/>
				</>
			) : (
				<MonthView
					currentDate={currentDate}
					selectedDate={selectedDate}
					today={today}
					bookings={bookingsForSelectedDate}
					onPrevMonth={handlePrevMonth}
					onNextMonth={handleNextMonth}
					onToday={handleToday}
					onSwitchToDay={() => setViewMode("day")}
					onDateClick={handleDateClick}
				/>
			)}

			{/* Modals */}
			<ViewBookingModal
				isOpen={!!viewingBooking}
				onClose={() => setViewingBooking(null)}
				booking={viewingBooking}
				onEdit={handleEditFromView}
				onDelete={handleDeleteFromView}
			/>

			<CreateBookingModal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				selectedTime={selectedTimeSlot}
				selectedDate={selectedDate}
			/>

			<EditBookingModal
				isOpen={!!editingBooking}
				onClose={() => setEditingBooking(null)}
				booking={editingBooking}
			/>

			<DeleteBookingDialog
				isOpen={!!deletingBooking}
				onClose={() => setDeletingBooking(null)}
				booking={deletingBooking}
			/>
		</div>
	);
}
