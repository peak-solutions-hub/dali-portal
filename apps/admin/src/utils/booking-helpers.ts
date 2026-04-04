import {
	CONFERENCE_ROOM_LABELS,
	type ConferenceRoom,
	isSameDay,
} from "@repo/shared";

import type { TimeSlot } from "@/utils/time-utils";

const ROOM_KEYS = Object.keys(CONFERENCE_ROOM_LABELS) as ConferenceRoom[];

function normalizeRoomToken(input: string): string {
	return input.toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
}

export function resolveConferenceRoom(
	roomValue: string | null | undefined,
	roomLabel?: string | null,
): ConferenceRoom {
	const value = roomValue ?? "";

	if (ROOM_KEYS.includes(value as ConferenceRoom)) {
		return value as ConferenceRoom;
	}

	const normalized = normalizeRoomToken(value);
	if (ROOM_KEYS.includes(normalized as ConferenceRoom)) {
		return normalized as ConferenceRoom;
	}

	const byLabel = ROOM_KEYS.find(
		(key) => CONFERENCE_ROOM_LABELS[key] === value,
	);
	if (byLabel) {
		return byLabel;
	}

	if (roomLabel) {
		const normalizedLabel = normalizeRoomToken(roomLabel);
		const byProvidedLabel = ROOM_KEYS.find(
			(key) =>
				normalizeRoomToken(CONFERENCE_ROOM_LABELS[key]) === normalizedLabel,
		);
		if (byProvidedLabel) {
			return byProvidedLabel;
		}
	}

	const byNormalizedLabel = ROOM_KEYS.find(
		(key) => normalizeRoomToken(CONFERENCE_ROOM_LABELS[key]) === normalized,
	);
	if (byNormalizedLabel) {
		return byNormalizedLabel;
	}

	const fallback = ROOM_KEYS[0] ?? "room_a";
	console.warn("[room] Invalid room value; using fallback", {
		roomValue,
		roomLabel,
		normalized,
		fallback,
	});
	return fallback;
}

function normalizeRoomKey(room: string): ConferenceRoom {
	return resolveConferenceRoom(room);
}

// ---------------------------------------------------------------------------
// CalendarBooking — shared interface used across all calendar sub-components
// ---------------------------------------------------------------------------

export interface CalendarBooking {
	id: string;
	bookedBy: string;
	bookedByName: string | null;
	date: Date;
	/** "9:00 AM" formatted for display */
	startTime: string;
	/** "10:00 AM" formatted for display */
	endTime: string;
	/** "09:00" 24-hour local time for edit form */
	startTime24: string;
	/** "10:00" 24-hour local time for edit form */
	endTime24: string;
	roomKey: ConferenceRoom;
	room: string;
	purpose: string;
	requestedFor: string;
	status: "pending" | "confirmed" | "rejected";
	attachmentUrl: string | null;
	isPast: boolean;
}

// ---------------------------------------------------------------------------
// ISO → display time converters
// ---------------------------------------------------------------------------

/** Convert an ISO 8601 datetime string to a local 12-hour display string (e.g. "9:00 AM"). */
export function isoToTimeStr(iso: string): string {
	const d = new Date(iso);
	const h = d.getHours();
	const m = d.getMinutes();
	const period = h < 12 ? "AM" : "PM";
	const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
	return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
}

/** Convert an ISO 8601 datetime string to a 24-hour "HH:MM" string in local time. */
export function isoToTime24(iso: string): string {
	const d = new Date(iso);
	return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// API response → CalendarBooking mapper
// ---------------------------------------------------------------------------

interface ApiBooking {
	id: string;
	bookedBy: string;
	startTime: string;
	endTime: string;
	room: string;
	title: string;
	requestedFor: string;
	status: string;
	attachmentUrl: string | null;
	user?: { id: string; fullName: string } | null;
}

/** Map raw API booking objects to the CalendarBooking shape used by UI components. */
export function mapApiBookings(bookings: ApiBooking[]): CalendarBooking[] {
	return bookings.map((b) => {
		const roomKey = normalizeRoomKey(b.room);

		return {
			id: b.id,
			bookedBy: b.bookedBy,
			bookedByName: b.user?.fullName ?? null,
			date: new Date(b.startTime),
			startTime: isoToTimeStr(b.startTime),
			endTime: isoToTimeStr(b.endTime),
			startTime24: isoToTime24(b.startTime),
			endTime24: isoToTime24(b.endTime),
			roomKey,
			room: CONFERENCE_ROOM_LABELS[roomKey],
			purpose: b.title,
			requestedFor: b.requestedFor,
			status: b.status as "pending" | "confirmed" | "rejected",
			attachmentUrl: b.attachmentUrl,
			isPast: new Date(b.endTime) < new Date(),
		};
	});
}

// ---------------------------------------------------------------------------
// Time-line position for the red "current time" indicator
// ---------------------------------------------------------------------------

/**
 * Calculate the position of the red time-line as a percentage of the full day.
 * Returns `null` when the selected date is not today.
 */
export function getTimeLinePosition(
	selectedDate: Date,
	today: Date,
	now: Date,
): number | null {
	if (!isSameDay(selectedDate, today)) return null;
	const totalMinutes = now.getHours() * 60 + now.getMinutes();

	const START_MINUTES = 420; // 7:00 AM
	const END_MINUTES = 1020; // 5:00 PM

	if (totalMinutes < START_MINUTES) return 0;
	if (totalMinutes > END_MINUTES) return 100;

	const rangeMinutes = END_MINUTES - START_MINUTES;
	const currentInRange = totalMinutes - START_MINUTES;

	return (currentInRange / rangeMinutes) * 100;
}

// ---------------------------------------------------------------------------
// Slot index → display time range string
// ---------------------------------------------------------------------------

/**
 * Format a display time string for a single slot index (e.g. "9:00 AM").
 * The end time is the slot time + the interval.
 */
function formatSlotTime(hour: number, minute: number): string {
	const period = hour < 12 ? "AM" : "PM";
	const displayH = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
	return `${displayH}:${minute.toString().padStart(2, "0")} ${period}`;
}

/**
 * Given a range of slot indices, return a formatted "StartTime - EndTime" string.
 * `endIndex` is inclusive — the end time is calculated as the end slot + 15 min.
 */
export function getSlotTimeRange(
	timeSlots: TimeSlot[],
	startIndex: number,
	endIndex: number,
): string | null {
	const startSlot = timeSlots[startIndex];
	const endSlot = timeSlots[endIndex];
	if (!startSlot || !endSlot) return null;

	const startTime = formatSlotTime(startSlot.hour, startSlot.minute);

	// End time = endSlot + 15 min interval
	const endTotalMinutes = endSlot.hour * 60 + endSlot.minute + 15;
	const endHour = Math.floor(endTotalMinutes / 60) % 24;
	const endMinute = endTotalMinutes % 60;
	const endTime = formatSlotTime(endHour, endMinute);

	return `${startTime} - ${endTime}`;
}
