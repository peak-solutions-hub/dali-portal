export interface TimeSlot {
	time: string;
	hour: number;
	isBooked: boolean;
	status?: "confirmed" | "pending";
}

export function generateTimeSlots(): TimeSlot[] {
	const slots: TimeSlot[] = [];
	for (let hour = 0; hour < 24; hour++) {
		const period = hour < 12 ? "AM" : "PM";
		let displayHour = hour % 12;
		if (displayHour === 0) displayHour = 12;
		slots.push({
			time: `${displayHour} ${period}`,
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
