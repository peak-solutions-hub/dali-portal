export const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const isSameDay = (date1: Date, date2: Date) => {
	return (
		date1.getDate() === date2.getDate() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getFullYear() === date2.getFullYear()
	);
};

export const formatFullDate = (date: Date) => {
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
};

export const formatDayName = (date: Date) => {
	return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
};

export const getCalendarDays = (currentDate: Date) => {
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const daysInMonth = lastDay.getDate();
	const startingDayOfWeek = firstDay.getDay();

	const days: (number | null)[] = [];
	for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
	for (let day = 1; day <= daysInMonth; day++) days.push(day);
	return days;
};

/**
 * Converts a display date string (e.g., "January 18, 2026") to MM/DD/YYYY format
 */
export const parseDisplayDateToInput = (displayDate: string): string => {
	try {
		const date = new Date(displayDate);
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const year = date.getFullYear();
		return `${month}/${day}/${year}`;
	} catch {
		return displayDate;
	}
};
