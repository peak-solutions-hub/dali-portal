"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
	BookingModal,
	RoomBookingCalendar,
} from "@/components/conference-room";

export default function ConferenceRoomBooking() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="p-1">
				<div className="flex items-center justify-between ml-6">
					<p className="text-base text-black">
						View bookings and create reservations
					</p>
					<button
						onClick={() => setIsModalOpen(true)}
						className="mr-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						Create Booking
					</button>
				</div>
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
