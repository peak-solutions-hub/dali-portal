"use client";

import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { Separator } from "@repo/ui/components/separator";
import { TimePickerInline } from "@repo/ui/components/time-picker-inline";
import { CalendarIcon } from "@repo/ui/lib/lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { formatDateDisplay, toDateString } from "./date-picker-field";

interface DateTimePickerFieldProps {
	/**
	 * ISO-ish value: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm" or null.
	 * The component stores and emits "YYYY-MM-DDTHH:mm".
	 */
	value: string | null;
	/** Callback with "YYYY-MM-DDTHH:mm" or null */
	onChange: (value: string | null) => void;
	placeholder?: string;
	/** Return true to disable a specific date */
	disabledDate?: (date: Date) => boolean;
	align?: "start" | "center" | "end";
	className?: string;
	disabled?: boolean;
}

function parseDateTimeValue(value: string | null): {
	dateStr: string | null;
	timeStr: string;
} {
	if (!value) return { dateStr: null, timeStr: "10:00" };
	// support both T and space separators
	const parts = value.includes("T") ? value.split("T") : value.split(" ");
	const dateStr = parts[0] || null;
	const timeStr = parts[1] || "10:00";
	return { dateStr, timeStr };
}

function formatTimeDisplay(time: string): string {
	const [h, m] = time.split(":").map(Number);
	const hour24 = h ?? 0;
	const minute = m ?? 0;
	const period = hour24 >= 12 ? "PM" : "AM";
	const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
	return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function DateTimePickerField({
	value,
	onChange,
	placeholder = "Pick date & time",
	disabledDate,
	align = "start",
	className,
	disabled = false,
}: DateTimePickerFieldProps) {
	const { dateStr, timeStr } = parseDateTimeValue(value);
	const selectedDate = dateStr ? new Date(`${dateStr}T00:00:00`) : undefined;
	const currentYear = new Date().getFullYear();

	const emitValue = (date: string | null, time: string) => {
		if (!date) {
			onChange(null);
			return;
		}
		onChange(`${date}T${time}`);
	};

	const displayText = () => {
		if (!dateStr) return placeholder;
		return `${formatDateDisplay(dateStr)}, ${formatTimeDisplay(timeStr)}`;
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"h-9 w-full justify-start text-left text-sm font-normal",
						!dateStr && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="mr-2 size-4" />
					{displayText()}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align={align}>
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={(date) => {
						emitValue(date ? toDateString(date) : null, timeStr);
					}}
					disabled={disabledDate}
					captionLayout="dropdown"
					fromYear={Math.max(currentYear - 100, 1950)}
					toYear={currentYear + 5}
				/>
				<Separator />
				<div className="p-3">
					<TimePickerInline
						value={timeStr}
						onChange={(newTime) => {
							emitValue(dateStr, newTime);
						}}
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export { DateTimePickerField };
export type { DateTimePickerFieldProps };
