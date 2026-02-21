"use client";

import { isAdminBookingRole } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { CalendarDays, ClipboardList, Plus, User } from "lucide-react";
import { useState } from "react";
import {
	BookingRequestsList,
	CreateBookingModal,
	MyBookingsList,
	RoomBookingCalendar,
} from "@/components/conference-room";
import { useAuthStore } from "@/stores";

export default function ConferenceRoomBooking() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const userProfile = useAuthStore((s) => s.userProfile);
	const userRole = userProfile?.role.name;
	const canManageRequests = userRole ? isAdminBookingRole(userRole) : false;

	return (
		<div className="min-h-screen">
			<div className="flex items-center justify-between ml-6">
				<h1 className="text-2xl font-semibold text-[#101828]">
					Conference Room Booking
				</h1>
				<Button
					onClick={() => setIsModalOpen(true)}
					className="mr-6 py-2 bg-[#a60202] hover:bg-[#8a0101] text-white gap-2"
				>
					<Plus className="w-4 h-4" />
					Create Booking
				</Button>
			</div>
			<p className="text-sm text-[#4a5565] ml-6 mb-4">
				View bookings and create reservations
			</p>

			<Tabs defaultValue="calendar" className="px-6">
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

				<TabsContent value="calendar" className="mt-6 -mx-6">
					<RoomBookingCalendar />
				</TabsContent>

				<TabsContent value="my-bookings" className="mt-6">
					<MyBookingsList />
				</TabsContent>

				{canManageRequests && (
					<TabsContent value="requests" className="mt-6">
						<BookingRequestsList />
					</TabsContent>
				)}
			</Tabs>

			<CreateBookingModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				selectedTime=""
				selectedDate={new Date()}
			/>
		</div>
	);
}
