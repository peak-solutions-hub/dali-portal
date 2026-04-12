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
	id?: string;
	value?: string; // "HH:mm" format
	onChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	minTime?: string; // "HH:mm" 24-hour format
	maxTime?: string; // "HH:mm" 24-hour format
	"aria-label"?: string;
	"aria-labelledby"?: string;
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
	id,
	value,
	onChange,
	placeholder = "Select time",
	className,
	disabled = false,
	minTime,
	maxTime,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledby,
}: TimePickerProps) {
	const [open, setOpen] = React.useState(false);

	const hours = Array.from({ length: 12 }, (_, i) => i + 1);
	const minutes = Array.from({ length: 4 }, (_, i) => i * 15);

	const parsedMin = React.useMemo(() => {
		if (!minTime) return { hour: 0, minute: 0 };
		const [h, m] = minTime.split(":").map(Number);
		return { hour: h ?? 0, minute: m ?? 0 };
	}, [minTime]);

	const parsedMax = React.useMemo(() => {
		if (!maxTime) return { hour: 23, minute: 59 };
		const [h, m] = maxTime.split(":").map(Number);
		return { hour: h ?? 23, minute: m ?? 59 };
	}, [maxTime]);

	const minTotalMinutes = parsedMin.hour * 60 + parsedMin.minute;
	const maxTotalMinutes = parsedMax.hour * 60 + parsedMax.minute;

	const isTimeValid = React.useCallback(
		(hour12: number, minute: number, period: "AM" | "PM") => {
			let hour24 = hour12;
			if (period === "AM" && hour12 === 12) hour24 = 0;
			else if (period === "PM" && hour12 !== 12) hour24 = hour12 + 12;
			const totalMinutes = hour24 * 60 + minute;
			return totalMinutes >= minTotalMinutes && totalMinutes <= maxTotalMinutes;
		},
		[minTotalMinutes, maxTotalMinutes],
	);

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
		let newPeriod = selectedPeriod;
		const validInCurrentPeriod = minutes.some((m) =>
			isTimeValid(hour, m, newPeriod),
		);

		if (!validInCurrentPeriod) {
			newPeriod = newPeriod === "AM" ? "PM" : "AM";
			setSelectedPeriod(newPeriod);
		}

		let newMinute = selectedMinute;
		if (!isTimeValid(hour, newMinute, newPeriod)) {
			const validMinute = minutes.find((m) => isTimeValid(hour, m, newPeriod));
			if (validMinute !== undefined) {
				newMinute = validMinute;
				setSelectedMinute(newMinute);
			}
		}

		setSelectedHour(hour);
		commitTime(hour, newMinute, newPeriod);
	};

	const handleMinuteSelect = (minute: number) => {
		setSelectedMinute(minute);
		commitTime(selectedHour, minute, selectedPeriod);
	};

	const handlePeriodSelect = (period: "AM" | "PM") => {
		let newMinute = selectedMinute;

		if (!isTimeValid(selectedHour, newMinute, period)) {
			const validMinute = minutes.find((m) =>
				isTimeValid(selectedHour, m, period),
			);
			if (validMinute !== undefined) {
				newMinute = validMinute;
				setSelectedMinute(newMinute);
			}
		}

		setSelectedPeriod(period);
		commitTime(selectedHour, newMinute, period);
	};

	const displayValue = value
		? `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")} ${selectedPeriod}`
		: null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					aria-label={ariaLabel}
					aria-labelledby={ariaLabelledby}
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
							{hours.map((hour) => {
								const validInAM = minutes.some((m) =>
									isTimeValid(hour, m, "AM"),
								);
								const validInPM = minutes.some((m) =>
									isTimeValid(hour, m, "PM"),
								);
								const isValidHour = validInAM || validInPM;

								return (
									<button
										key={hour}
										type="button"
										disabled={!isValidHour}
										onClick={() => handleHourSelect(hour)}
										className={cn(
											"rounded-md px-3 py-1.5 text-sm transition-colors",
											selectedHour === hour
												? "bg-primary text-primary-foreground"
												: !isValidHour
													? "opacity-30 cursor-not-allowed"
													: "hover:bg-accent hover:text-accent-foreground cursor-pointer",
										)}
									>
										{String(hour).padStart(2, "0")}
									</button>
								);
							})}
						</div>
					</ScrollColumn>

					{/* Minutes Column */}
					<ScrollColumn className="h-56">
						<div className="flex flex-col p-1">
							<div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
								Min
							</div>
							{minutes.map((minute) => {
								const isValidMinute = isTimeValid(
									selectedHour,
									minute,
									selectedPeriod,
								);

								return (
									<button
										key={minute}
										type="button"
										disabled={!isValidMinute}
										onClick={() => handleMinuteSelect(minute)}
										className={cn(
											"rounded-md px-3 py-1.5 text-sm transition-colors",
											selectedMinute === minute
												? "bg-primary text-primary-foreground"
												: !isValidMinute
													? "opacity-30 cursor-not-allowed"
													: "hover:bg-accent hover:text-accent-foreground cursor-pointer",
										)}
									>
										{String(minute).padStart(2, "0")}
									</button>
								);
							})}
						</div>
					</ScrollColumn>

					{/* AM/PM Column */}
					<div className="flex flex-col p-1">
						<div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
							&nbsp;
						</div>
						{(["AM", "PM"] as const).map((period) => {
							const isValidPeriodForHour = minutes.some((m) =>
								isTimeValid(selectedHour, m, period),
							);

							return (
								<button
									key={period}
									type="button"
									disabled={!isValidPeriodForHour}
									onClick={() => handlePeriodSelect(period)}
									className={cn(
										"rounded-md px-3 py-1.5 text-sm transition-colors",
										selectedPeriod === period
											? "bg-primary text-primary-foreground"
											: !isValidPeriodForHour
												? "opacity-30 cursor-not-allowed"
												: "hover:bg-accent hover:text-accent-foreground cursor-pointer",
									)}
								>
									{period}
								</button>
							);
						})}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export { TimePicker };
export type { TimePickerProps };
