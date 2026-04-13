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

/**
 * A date picker filter that uses the shared Calendar/Popover components.
 * Stores dates as YYYY-MM-DD strings (compatible with the document store).
 */
interface DatePickerFilterProps {
	value: string | null;
	onChange: (value: string | null) => void;
	placeholder?: string;
	disabledDate?: (date: Date) => boolean;
	align?: "start" | "center" | "end";
	className?: string;
}

function formatDateDisplay(dateStr: string): string {
	const date = new Date(`${dateStr}T00:00:00`);
	return date.toLocaleDateString("en-PH", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function toDateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function DatePickerFilter({
	value,
	onChange,
	placeholder = "Pick a date",
	disabledDate,
	align = "start",
	className,
}: DatePickerFilterProps) {
	const currentYear = new Date().getFullYear();
	const selectedDate = value ? new Date(`${value}T00:00:00`) : undefined;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"h-9 w-full justify-start text-left text-sm font-normal",
						!value && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="mr-2 size-4" />
					{value ? formatDateDisplay(value) : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align={align}>
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={(date) => {
						onChange(date ? toDateString(date) : null);
					}}
					disabled={disabledDate}
					captionLayout="dropdown"
					fromYear={Math.max(currentYear - 100, 1950)}
					toYear={currentYear}
				/>
			</PopoverContent>
		</Popover>
	);
}
