"use client";

import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { CalendarIcon } from "@repo/ui/lib/lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { DateRange } from "react-day-picker";
import { formatDateDisplay, toDateString } from "./date-picker-field";

interface DateRangePickerFieldProps {
	/** Start date as "YYYY-MM-DD" string or null */
	from: string | null;
	/** End date as "YYYY-MM-DD" string or null */
	to: string | null;
	/** Callback with from/to as "YYYY-MM-DD" or null */
	onChange: (from: string | null, to: string | null) => void;
	placeholder?: string;
	/** Return true to disable a specific date */
	disabledDate?: (date: Date) => boolean;
	align?: "start" | "center" | "end";
	className?: string;
	disabled?: boolean;
	/** Number of months to show side-by-side (default: 2) */
	numberOfMonths?: number;
}

function DateRangePickerField({
	from,
	to,
	onChange,
	placeholder = "Pick a date range",
	disabledDate,
	align = "start",
	className,
	disabled = false,
	numberOfMonths = 2,
}: DateRangePickerFieldProps) {
	const selectedRange: DateRange | undefined =
		from || to
			? {
					from: from ? new Date(`${from}T00:00:00`) : undefined,
					to: to ? new Date(`${to}T00:00:00`) : undefined,
				}
			: undefined;

	const displayText = () => {
		if (from && to) {
			return `${formatDateDisplay(from)} – ${formatDateDisplay(to)}`;
		}
		if (from) {
			return formatDateDisplay(from);
		}
		return placeholder;
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"h-9 w-full justify-start text-left text-sm font-normal",
						!from && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="mr-2 size-4" />
					{displayText()}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align={align}>
				<Calendar
					mode="range"
					selected={selectedRange}
					onSelect={(range) => {
						onChange(
							range?.from ? toDateString(range.from) : null,
							range?.to ? toDateString(range.to) : null,
						);
					}}
					disabled={disabledDate}
					numberOfMonths={numberOfMonths}
				/>
			</PopoverContent>
		</Popover>
	);
}

export { DateRangePickerField };
export type { DateRangePickerFieldProps };
