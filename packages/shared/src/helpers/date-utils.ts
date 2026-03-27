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

export const PH_TIME_ZONE = "Asia/Manila";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type DateInput = Date | string | number;

export const parseDateInput = (input: DateInput): Date => {
	if (input instanceof Date) {
		return new Date(input.getTime());
	}

	if (typeof input === "number") {
		return new Date(input);
	}

	const value = input.trim();

	// Keep date-only inputs deterministic across client timezones.
	if (DATE_ONLY_REGEX.test(value)) {
		const [yearStr, monthStr, dayStr] = value.split("-");
		const year = Number(yearStr);
		const month = Number(monthStr);
		const day = Number(dayStr);
		return new Date(Date.UTC(year, month - 1, day));
	}

	return new Date(value);
};

export const isValidDate = (date: Date): boolean =>
	!Number.isNaN(date.getTime());

type FormatDateOptions = Intl.DateTimeFormatOptions & {
	locale?: string;
	fallback?: string;
};

export const formatDateValue = (
	input: DateInput,
	options: FormatDateOptions,
): string => {
	const { locale = "en-US", fallback = "N/A", ...intlOptions } = options;
	const date = parseDateInput(input);

	if (!isValidDate(date)) {
		return fallback;
	}

	return new Intl.DateTimeFormat(locale, intlOptions).format(date);
};

export const formatDateInPHT = (
	input: DateInput,
	options: Omit<FormatDateOptions, "timeZone">,
): string => {
	return formatDateValue(input, {
		...options,
		timeZone: PH_TIME_ZONE,
	});
};

export const formatDateTimeInPHT = (input: DateInput): string => {
	return formatDateInPHT(input, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

export const formatIsoDateInPHT = (input: DateInput): string => {
	const date = parseDateInput(input);

	if (!isValidDate(date)) {
		return "";
	}

	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: PH_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parts.find((part) => part.type === "day")?.value;

	if (!year || !month || !day) {
		return "";
	}

	return `${year}-${month}-${day}`;
};

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
		const date = parseDateInput(displayDate);
		if (!isValidDate(date)) {
			return displayDate;
		}
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const year = date.getFullYear();
		return `${month}/${day}/${year}`;
	} catch {
		return displayDate;
	}
};
