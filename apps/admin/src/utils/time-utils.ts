export interface TimeSlot {
	time: string;
	hour: number;
	isBooked: boolean;
	status?: "confirmed" | "pending";
}

export function generateTimeSlots(): TimeSlot[] {
	const slots: TimeSlot[] = [];
	// Include all 24 hours (0-23), but don't show label for hour 0 (12 AM)
	for (let hour = 0; hour < 24; hour++) {
		let timeLabel = "";
		if (hour !== 0) {
			// Show label for hours 1-23
			const period = hour < 12 ? "AM" : "PM";
			let displayHour = hour % 12;
			if (displayHour === 0) displayHour = 12;
			timeLabel = `${displayHour} ${period}`;
		}
		slots.push({
			time: timeLabel,
			hour,
			isBooked: false,
		});
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
 * Parse time string to hour in 24-hour format
 * @param timeStr - Time string like "9:00 AM" or "2:00 PM"
 * @returns Hour in 24-hour format (0-23)
 */
export function parseTimeToHour(timeStr: string): number {
	const parts = timeStr.split(" ");
	const time = parts[0];
	const period = parts[1];

	if (!time || !period) return 0;

	let hour = parseInt(time.split(":")[0] || time);
	if (period === "PM" && hour !== 12) hour += 12;
	if (period === "AM" && hour === 12) hour = 0;
	return hour;
}

/**
 * Check if a time slot hour falls within a booking time range
 * @param slotHour - Hour of the time slot (0-23)
 * @param startTime - Booking start time string (e.g., "9:00 AM")
 * @param endTime - Booking end time string (e.g., "11:00 AM")
 * @returns true if the slot overlaps with the booking
 */
export function isTimeSlotBooked(
	slotHour: number,
	startTime: string,
	endTime: string,
): boolean {
	const bookingStartHour = parseTimeToHour(startTime);
	const bookingEndHour = parseTimeToHour(endTime);
	return slotHour >= bookingStartHour && slotHour < bookingEndHour;
}
