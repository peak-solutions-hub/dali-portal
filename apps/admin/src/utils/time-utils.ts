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
