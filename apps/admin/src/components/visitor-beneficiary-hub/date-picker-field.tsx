"use client";

import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

type DatePickerFieldProps = {
	label: string;
	date: Date | undefined;
	onSelect: (date: Date | undefined) => void;
	disabled?: (date: Date) => boolean;
	error?: boolean;
};

export function DatePickerField({
	label,
	date,
	onSelect,
	disabled,
	error = false,
}: DatePickerFieldProps) {
	const currentYear = new Date().getFullYear();
	const minYear = Math.max(currentYear - 100, 1950);

	return (
		<div className="space-y-1.5">
			{label ? (
				<p className="text-sm font-medium text-gray-700">{label}</p>
			) : null}
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={`h-9 w-full justify-start gap-2 border-[rgba(0,0,0,0.1)] text-left text-sm font-normal hover:bg-white ${
							error ? "border-red-500" : ""
						}`}
					>
						<CalendarIcon className="h-4 w-4 text-gray-500" />
						{date ? format(date, "P") : "Pick a date"}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={date}
						onSelect={onSelect}
						disabled={disabled}
						captionLayout="dropdown"
						fromYear={minYear}
						toYear={currentYear}
						classNames={{
							today: "bg-transparent text-yellow-400 font-normal",
							day_selected:
								"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
						}}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
			{error ? (
				<p className="text-xs text-red-600">This field is required.</p>
			) : null}
		</div>
	);
}
