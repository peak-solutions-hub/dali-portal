"use client";

import { isAdminBookingRole } from "@repo/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMonthBookings, useRoomBookings } from "@/hooks/room-booking";
import { useAuthStore } from "@/stores/auth-store";
import {
	type CalendarBooking,
	type EditBookingData,
	getTimeLinePosition,
	mapApiBookings,
	mapBookingToEditBookingData,
} from "@/utils/booking-helpers";
import { CalendarSidebar } from "./calendar-sidebar";
import { CreateBookingModal } from "./create-booking-modal";
import { DayView } from "./day-view";
import { DeleteBookingDialog } from "./delete-booking-dialog";
import { EditBookingModal } from "./edit-booking-modal";
import { MonthView } from "./month-view";
import { ViewBookingModal } from "./view-booking-modal";

interface RoomBookingCalendarProps {
	onSelectedDateChange?: (date: Date) => void;
}

export function RoomBookingCalendar({
	onSelectedDateChange,
}: RoomBookingCalendarProps) {
	const today = useMemo(() => new Date(), []);
	const [currentDate, setCurrentDate] = useState(today);
	const [selectedDate, setSelectedDate] = useState(today);
	const [viewMode, setViewMode] = useState<"day" | "month">("day");
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [now, setNow] = useState(new Date());
	const userProfile = useAuthStore((state) => state.userProfile);
	const userId = userProfile?.id ?? null;
	const userRole = userProfile?.role.name;
	const canApprove = userRole ? isAdminBookingRole(userRole) : false;

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

	// Fetch all bookings for the current month (used by month view)
	const { data: monthData } = useMonthBookings(
		currentDate.getFullYear(),
		currentDate.getMonth(),
	);

	const bookingsForSelectedDate = useMemo(
		(): CalendarBooking[] =>
			bookingsData?.bookings ? mapApiBookings(bookingsData.bookings) : [],
		[bookingsData],
	);

	const monthBookings = useMemo(
		(): CalendarBooking[] =>
			monthData?.bookings ? mapApiBookings(monthData.bookings) : [],
		[monthData],
	);

	// Update time for the red indicator line
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		onSelectedDateChange?.(selectedDate);
	}, [onSelectedDateChange, selectedDate]);

	const timeLinePosition = useMemo(
		() => getTimeLinePosition(selectedDate, today, now),
		[selectedDate, now, today],
	);

	const isPastSelectedDate = useMemo(() => {
		const selected = new Date(selectedDate);
		selected.setHours(0, 0, 0, 0);
		const todayStart = new Date(today);
		todayStart.setHours(0, 0, 0, 0);
		return selected < todayStart;
	}, [selectedDate, today]);

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

		const newDateStart = new Date(newDate);
		newDateStart.setHours(0, 0, 0, 0);
		const todayStart = new Date(today);
		todayStart.setHours(0, 0, 0, 0);
		const canCreateOnDate = newDateStart >= todayStart;

		if (viewMode === "month") {
			setSelectedTimeSlot("");
			if (canCreateOnDate) {
				setIsCreateOpen(true);
			} else {
				toast.error("Cannot create bookings in the past");
			}
		}
	};

	const handleDateNumberClick = (day: number) => {
		const newDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			day,
		);
		setSelectedDate(newDate);

		if (viewMode === "month") {
			setSelectedTimeSlot("");
			setViewMode("day");
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
		setEditingBooking(mapBookingToEditBookingData(booking));
	};

	const handleDeleteFromView = (booking: CalendarBooking) => {
		setViewingBooking(null);
		setDeletingBooking({ id: booking.id, title: booking.purpose });
	};

	const handleSelectTimeRange = (timeRange: string) => {
		if (isPastSelectedDate) {
			toast.error("Cannot create bookings in the past");
			return;
		}
		setSelectedTimeSlot(timeRange);
		setIsCreateOpen(true);
	};

	const canEditViewedBooking =
		viewingBooking !== null &&
		userId !== null &&
		viewingBooking.bookedBy === userId &&
		!viewingBooking.isPast;

	const canDeleteViewedBooking =
		viewingBooking !== null &&
		userId !== null &&
		(viewingBooking.bookedBy === userId || canApprove);

	return (
		<div className="flex-1 h-full min-h-0 flex gap-6 p-3 overflow-hidden bg-gray-50">
			{viewMode === "day" ? (
				<>
					{!isSidebarCollapsed && (
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
					)}
					<div className="relative flex-1 min-h-0">
						<button
							type="button"
							onClick={() => setIsSidebarCollapsed((previous) => !previous)}
							className="absolute left-0 top-4 z-30 -translate-x-1/2 rounded-full border border-gray-200 bg-white p-1.5 shadow-sm hover:bg-gray-50"
							title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
							aria-label={
								isSidebarCollapsed
									? "Expand calendar sidebar"
									: "Collapse calendar sidebar"
							}
						>
							{isSidebarCollapsed ? (
								<ChevronRight className="w-4 h-4 text-gray-600" />
							) : (
								<ChevronLeft className="w-4 h-4 text-gray-600" />
							)}
						</button>
						<DayView
							selectedDate={selectedDate}
							today={today}
							now={now}
							canCreateBookings={!isPastSelectedDate}
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
					</div>
				</>
			) : (
				<MonthView
					currentDate={currentDate}
					selectedDate={selectedDate}
					today={today}
					bookings={monthBookings}
					onPrevMonth={handlePrevMonth}
					onNextMonth={handleNextMonth}
					onToday={handleToday}
					onSwitchToDay={() => setViewMode("day")}
					onDateClick={handleDateClick}
					onDateNumberClick={handleDateNumberClick}
					onViewBooking={handleViewBooking}
				/>
			)}

			{/* Modals */}
			<ViewBookingModal
				isOpen={!!viewingBooking}
				onClose={() => setViewingBooking(null)}
				booking={viewingBooking}
				onEdit={handleEditFromView}
				onDelete={handleDeleteFromView}
				canEdit={canEditViewedBooking}
				canDelete={canDeleteViewedBooking}
				canApprove={canApprove}
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
