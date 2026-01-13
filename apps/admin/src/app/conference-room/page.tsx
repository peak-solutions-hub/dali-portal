import { RoomBookingCalendar } from "@/components/conference-room";

export default function ConferenceRoomBooking() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900">
						Conference Room Booking
					</h1>
					<p className="text-sm text-gray-600 mt-1">
						View bookings and create new reservations
					</p>
				</div>
				<RoomBookingCalendar />
			</div>
		</div>
	);
}
