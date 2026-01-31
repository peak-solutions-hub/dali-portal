"use client";

import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
	BookingModal,
	RoomBookingCalendar,
} from "@/components/conference-room";

export default function ConferenceRoomBooking() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<div className="min-h-screen">
			<div className="p-1">
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
				<p className="text-sm text-[#4a5565] ml-6">
					View bookings and create reservations
				</p>
				<RoomBookingCalendar />
			</div>

			<BookingModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				selectedTime=""
				selectedDate=""
			/>
		</div>
	);
}
