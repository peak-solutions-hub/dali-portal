export interface TimeSlot {
	time: string;
	hour: number;
	minute: number;
	isBooked: boolean;
	status?: "confirmed" | "pending";
}

export function generateTimeSlots(intervalMinutes: number = 15): TimeSlot[] {
	const slots: TimeSlot[] = [];

	for (let hour = 0; hour < 24; hour++) {
		for (let minute = 0; minute < 60; minute += intervalMinutes) {
			const period = hour < 12 ? "AM" : "PM";
			let displayHour = hour % 12;
			if (displayHour === 0) displayHour = 12;

			// Only show time label on the hour (when minute === 0)
			let timeLabel = "";
			if (minute === 0 && !(hour === 0 && minute === 0)) {
				timeLabel = `${displayHour}:00 ${period}`;
			}

			slots.push({
				time: timeLabel,
				hour,
				minute,
				isBooked: false,
			});
		}
	}

	return slots;
}

export function formatHour(hour: number): string {
	const h = hour % 24;
	const period = h < 12 ? "AM" : "PM";
	let displayHour = h % 12;
	if (displayHour === 0) displayHour = 12;
	return `${displayHour} ${period}`;
}

/**
 * Converts a time string (e.g., "8 AM") to formatted input time (e.g., "08:00 AM")
 */
export function formatTimeToInput(time: string): string {
	const match = time.match(/(\d+)\s*(AM|PM)/i);
	if (match && match[1] && match[2]) {
		const hour = match[1].padStart(2, "0");
		const period = match[2].toUpperCase();
		return `${hour}:00 ${period}`;
	}
	return time;
}

/**
 * Converts 12-hour format with AM/PM to 24-hour format (HH:MM) for time input
 * @param time12h - Time string like "8 AM" or "2:30 PM"
 * @returns Time in 24-hour format like "08:00" or "14:30"
 */
export function convertTo24HourFormat(time12h: string): string {
	const match = time12h.match(/(\d+):?(\d+)?\s*(AM|PM)/i);
	if (!match) return "";

	let hour = parseInt(match[1] || "0");
	const minute = match[2] || "00";
	const period = match[3]?.toUpperCase();

	if (period === "PM" && hour !== 12) hour += 12;
	if (period === "AM" && hour === 12) hour = 0;

	return `${hour.toString().padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/**
 * Converts 24-hour format (HH:MM) to 12-hour format with AM/PM
 * @param time24h - Time string like "14:30"
 * @returns Time in 12-hour format like "2:30 PM"
 */
export function convertTo12HourFormat(time24h: string): string {
	const [hourStr, minute] = time24h.split(":");
	let hour = parseInt(hourStr || "0");
	const period = hour >= 12 ? "PM" : "AM";

	if (hour === 0) hour = 12;
	else if (hour > 12) hour -= 12;

	return `${hour}:${minute} ${period}`;
}

/**
 * Parse time string to total minutes from midnight
 * @param timeStr - Time string like "9:30 AM" or "2:15 PM"
 * @returns Total minutes from midnight (0-1439)
 */
export function parseTimeToMinutes(timeStr: string): number {
	const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
	if (!match) return 0;

	let hour = parseInt(match[1] || "0");
	const minute = parseInt(match[2] || "0");
	const period = match[3]?.toUpperCase();

	if (period === "PM" && hour !== 12) hour += 12;
	if (period === "AM" && hour === 12) hour = 0;

	return hour * 60 + minute;
}

/**
 * Parse time string to hour in 24-hour format
 * @param timeStr - Time string like "9:00 AM" or "2:00 PM"
 * @returns Hour in 24-hour format (0-23)
 */
export function parseTimeToHour(timeStr: string): number {
	const match = timeStr.match(/(\d+):?(\d+)?\s*(AM|PM)/i);
	if (!match) return 0;

	let hour = parseInt(match[1] || "0");
	const period = match[3]?.toUpperCase();

	if (period === "PM" && hour !== 12) hour += 12;
	if (period === "AM" && hour === 12) hour = 0;

	return hour;
}

/**
 * Check if a time slot falls within a booking time range
 * @param slotHour - Hour of the slot (0-23)
 * @param slotMinute - Minute of the slot (0-59)
 * @param startTime - Booking start time string (e.g., "9:30 AM")
 * @param endTime - Booking end time string (e.g., "11:00 AM")
 * @returns true if the slot overlaps with the booking
 */
export function isTimeSlotBooked(
	slotHour: number,
	slotMinute: number,
	startTime: string,
	endTime: string,
): boolean {
	const slotMinutes = slotHour * 60 + slotMinute;
	const startMinutes = parseTimeToMinutes(startTime);
	const endMinutes = parseTimeToMinutes(endTime);

	return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}
