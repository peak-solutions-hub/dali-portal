export const RoomBookingStatus = {
	PENDING: "pending",
	CONFIRMED: "confirmed",
	REJECTED: "rejected",
} as const;

export type RoomBookingStatus =
	(typeof RoomBookingStatus)[keyof typeof RoomBookingStatus];
export const ROOM_BOOKING_STATUS_VALUES: RoomBookingStatus[] =
	Object.values(RoomBookingStatus);

export const ConferenceRoom = {
	ROOM_A: "room_a",
	ROOM_B: "room_b",
} as const;

export type ConferenceRoom =
	(typeof ConferenceRoom)[keyof typeof ConferenceRoom];
export const CONFERENCE_ROOM_VALUES: ConferenceRoom[] =
	Object.values(ConferenceRoom);

export const MeetingType = {
	COMMITTEE_HEARING: "committee_hearing",
	CONSULTATIVE_MEETING: "consultative_meeting",
	MEETING: "meeting",
	OTHERS: "others",
} as const;

export type MeetingType = (typeof MeetingType)[keyof typeof MeetingType];
export const MEETING_TYPE_VALUES: MeetingType[] = Object.values(MeetingType);
