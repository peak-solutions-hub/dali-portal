export const RoomBookingStatus = {
	PENDING: "pending",
	CONFIRMED: "confirmed",
	REJECTED: "rejected",
} as const;

export type RoomBookingStatus =
	(typeof RoomBookingStatus)[keyof typeof RoomBookingStatus];
export const ROOM_BOOKING_STATUS_VALUES: RoomBookingStatus[] =
	Object.values(RoomBookingStatus);
