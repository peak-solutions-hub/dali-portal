"use client";

import { Button } from "@repo/ui/components/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";
import { Clock } from "lucide-react";
import * as React from "react";

interface TimePickerProps {
	value?: string; // "HH:mm" format
	onChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

/** Scrollable column that supports native mouse wheel scrolling */
function ScrollColumn({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const ref = React.useRef<HTMLDivElement>(null);

	const handleWheel = React.useCallback(
		(e: React.WheelEvent<HTMLDivElement>) => {
			const el = ref.current;
			if (!el) return;
			// Prevent the popover from stealing scroll
			e.stopPropagation();
			el.scrollTop += e.deltaY;
		},
		[],
	);

	return (
		<div
			ref={ref}
			onWheel={handleWheel}
			className={cn("overflow-y-auto overscroll-contain", className)}
			style={{ scrollbarWidth: "thin" }}
		>
			{children}
		</div>
	);
}

function TimePicker({
	value,
	onChange,
	placeholder = "Select time",
	className,
	disabled = false,
}: TimePickerProps) {
	const [open, setOpen] = React.useState(false);

	const hours = Array.from({ length: 12 }, (_, i) => i + 1);
	const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

	const parsed = React.useMemo(() => {
		if (!value) return { hour: 10, minute: 0, period: "AM" as const };
		const [h, m] = value.split(":").map(Number);
		const hour24 = h ?? 0;
		const minute = m ?? 0;
		const period = hour24 >= 12 ? ("PM" as const) : ("AM" as const);
		const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
		return { hour: hour12, minute, period };
	}, [value]);

	const [selectedHour, setSelectedHour] = React.useState(parsed.hour);
	const [selectedMinute, setSelectedMinute] = React.useState(parsed.minute);
	const [selectedPeriod, setSelectedPeriod] = React.useState(parsed.period);

	React.useEffect(() => {
		setSelectedHour(parsed.hour);
		setSelectedMinute(parsed.minute);
		setSelectedPeriod(parsed.period);
	}, [parsed.hour, parsed.minute, parsed.period]);

	const commitTime = React.useCallback(
		(hour: number, minute: number, period: "AM" | "PM") => {
			let hour24 = hour;
			if (period === "AM" && hour === 12) hour24 = 0;
			else if (period === "PM" && hour !== 12) hour24 = hour + 12;
			const timeStr = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
			onChange?.(timeStr);
		},
		[onChange],
	);

	const handleHourSelect = (hour: number) => {
		setSelectedHour(hour);
		commitTime(hour, selectedMinute, selectedPeriod);
	};

	const handleMinuteSelect = (minute: number) => {
		setSelectedMinute(minute);
		commitTime(selectedHour, minute, selectedPeriod);
	};

	const handlePeriodSelect = (period: "AM" | "PM") => {
		setSelectedPeriod(period);
		commitTime(selectedHour, selectedMinute, period);
	};

	const displayValue = value
		? `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")} ${selectedPeriod}`
		: null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"w-full justify-start text-left font-normal cursor-pointer",
						!value && "text-muted-foreground",
						className,
					)}
				>
					<Clock className="mr-2 h-4 w-4" />
					{displayValue ?? placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="flex divide-x">
					{/* Hours Column */}
					<ScrollColumn className="h-56">
						<div className="flex flex-col p-1">
							<div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
								Hour
							</div>
							{hours.map((hour) => (
								<button
									key={hour}
									type="button"
									onClick={() => handleHourSelect(hour)}
									className={cn(
										"rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors",
										selectedHour === hour
											? "bg-primary text-primary-foreground"
											: "hover:bg-accent hover:text-accent-foreground",
									)}
								>
									{String(hour).padStart(2, "0")}
								</button>
							))}
						</div>
					</ScrollColumn>

					{/* Minutes Column */}
					<ScrollColumn className="h-56">
						<div className="flex flex-col p-1">
							<div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
								Min
							</div>
							{minutes.map((minute) => (
								<button
									key={minute}
									type="button"
									onClick={() => handleMinuteSelect(minute)}
									className={cn(
										"rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors",
										selectedMinute === minute
											? "bg-primary text-primary-foreground"
											: "hover:bg-accent hover:text-accent-foreground",
									)}
								>
									{String(minute).padStart(2, "0")}
								</button>
							))}
						</div>
					</ScrollColumn>

					{/* AM/PM Column */}
					<div className="flex flex-col p-1">
						<div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
							&nbsp;
						</div>
						{(["AM", "PM"] as const).map((period) => (
							<button
								key={period}
								type="button"
								onClick={() => handlePeriodSelect(period)}
								className={cn(
									"rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors",
									selectedPeriod === period
										? "bg-primary text-primary-foreground"
										: "hover:bg-accent hover:text-accent-foreground",
								)}
							>
								{period}
							</button>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export { TimePicker };
export type { TimePickerProps };
