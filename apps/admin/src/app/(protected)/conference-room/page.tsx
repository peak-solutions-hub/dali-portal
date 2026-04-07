"use client";

import { isAdminBookingRole } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { BRAND_BUTTON_CLASS } from "@repo/ui/lib/legislative-document-ui";
import { cn } from "@repo/ui/lib/utils";
import { CalendarDays, ClipboardList, Plus, User } from "lucide-react";
import { useState } from "react";
import {
	BookingRequestsList,
	CreateBookingModal,
	MyBookingsList,
	RoomBookingCalendar,
} from "@/components/conference-room";
import {
	useMyBookings,
	usePendingRoomBookings,
	useRoomBookings,
} from "@/hooks/room-booking";
import { useAuthStore } from "@/stores";

export default function ConferenceRoomBooking() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
	const userProfile = useAuthStore((s) => s.userProfile);
	const userRole = userProfile?.role.name;
	const canManageRequests = userRole ? isAdminBookingRole(userRole) : false;

	// Pre-fetch data for all tabs on initial load
	useRoomBookings(new Date());
	useMyBookings(userProfile?.id ?? null);
	usePendingRoomBookings(canManageRequests);

	return (
		<div className="min-h-screen">
			<div className="flex items-center justify-between ml-6">
				<h1 className="text-2xl font-semibold text-[#101828]">
					Conference Room Booking
				</h1>
				<Button
					onClick={() => setIsModalOpen(true)}
					className={cn("mr-6 py-2 text-white gap-2", BRAND_BUTTON_CLASS)}
				>
					<Plus className="w-4 h-4" />
					Create Booking
				</Button>
			</div>
			<p className="text-sm text-[#4a5565] ml-6 mb-4">
				View bookings and create reservations
			</p>

			<Tabs
				defaultValue="calendar"
				className="px-6 flex-1 flex flex-col min-h-0"
			>
				<TabsList>
					<TabsTrigger value="calendar" className="gap-1.5">
						<CalendarDays className="h-4 w-4" />
						Calendar
					</TabsTrigger>
					<TabsTrigger value="my-bookings" className="gap-1.5">
						<User className="h-4 w-4" />
						My Bookings
					</TabsTrigger>
					{canManageRequests && (
						<TabsTrigger value="requests" className="gap-1.5">
							<ClipboardList className="h-4 w-4" />
							Booking Requests
						</TabsTrigger>
					)}
				</TabsList>

				<TabsContent
					value="calendar"
					forceMount
					className="mt-6 pb-6 flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden"
				>
					<RoomBookingCalendar onSelectedDateChange={setSelectedCalendarDate} />
				</TabsContent>

				<TabsContent
					value="my-bookings"
					forceMount
					className="mt-6 flex-1 min-h-0 overflow-auto data-[state=inactive]:hidden"
				>
					<MyBookingsList />
				</TabsContent>

				{canManageRequests && (
					<TabsContent
						value="requests"
						forceMount
						className="mt-6 flex-1 min-h-0 overflow-auto data-[state=inactive]:hidden"
					>
						<BookingRequestsList />
					</TabsContent>
				)}
			</Tabs>

			<CreateBookingModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				selectedTime=""
				selectedDate={selectedCalendarDate}
			/>
		</div>
	);
}
