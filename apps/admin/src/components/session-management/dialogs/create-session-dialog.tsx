"use client";

import { isDefinedError } from "@orpc/client";
import { formatIsoDateInPHT } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Calendar as CalendarComponent } from "@repo/ui/components/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { TimePicker } from "@repo/ui/components/time-picker";
import { Calendar, Loader2, Plus } from "@repo/ui/lib/lucide-react";
import { format } from "date-fns";
import { useId, useState } from "react";
import { api } from "@/lib/api.client";

const PHT_OFFSET_HOURS = 8;

const buildPhtDateTimeAsUtc = (
	selectedDateInCalendar: string,
	time: string,
): Date => {
	const [rawYear = Number.NaN, rawMonth = Number.NaN, rawDay = Number.NaN] =
		selectedDateInCalendar.split("-").map((part) => Number(part));
	const year = Number.isNaN(rawYear) ? 0 : rawYear;
	const month = Number.isNaN(rawMonth) ? 0 : rawMonth;
	const day = Number.isNaN(rawDay) ? 0 : rawDay;
	const [hoursPart = "10", minutesPart = "0"] = time.split(":");
	const rawHours = Number(hoursPart);
	const rawMinutes = Number(minutesPart);
	const hours = Number.isNaN(rawHours) ? 10 : rawHours;
	const minutes = Number.isNaN(rawMinutes) ? 0 : rawMinutes;

	return new Date(
		Date.UTC(year, month - 1, day, hours - PHT_OFFSET_HOURS, minutes, 0, 0),
	);
};

interface CreateSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSessionCreated?: (sessionId: string) => void;
}

export function CreateSessionDialog({
	open,
	onOpenChange,
	onSessionCreated,
}: CreateSessionDialogProps) {
	const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
	const [sessionTime, setSessionTime] = useState("10:00");
	const [sessionType, setSessionType] = useState("regular");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const todayInPht = formatIsoDateInPHT(new Date());
	const sessionTypeSelectId = useId();
	const sessionTypeLabelId = useId();
	const sessionDatePickerId = useId();
	const sessionDateLabelId = useId();
	const sessionTimePickerId = useId();
	const sessionTimeLabelId = useId();

	const getSessionValidationError = (
		selectedDate: Date | undefined,
		time: string,
	): string | null => {
		if (!selectedDate) {
			return "Please select a session date";
		}

		const selectedDateInCalendar = formatIsoDateInPHT(selectedDate);

		if (!selectedDateInCalendar) {
			return "Invalid session date";
		}

		if (selectedDateInCalendar < todayInPht) {
			return "Session date cannot be in the past";
		}

		const scheduleDate = buildPhtDateTimeAsUtc(selectedDateInCalendar, time);

		if (
			selectedDateInCalendar === todayInPht &&
			scheduleDate.getTime() < Date.now()
		) {
			return "Session time cannot be in the past for today's date";
		}

		return null;
	};

	const handleSessionTypeChange = (value: string) => {
		setSessionType(value);
		if (error) {
			setError(null);
		}
	};

	const handleSessionDateChange = (date: Date | undefined) => {
		setSessionDate(date);
		if (!error) return;

		const nextError = getSessionValidationError(date, sessionTime);
		if (!nextError) {
			setError(null);
		}
	};

	const handleSessionTimeChange = (time: string) => {
		setSessionTime(time);
		if (!error) return;

		const nextError = getSessionValidationError(sessionDate, time);
		if (!nextError) {
			setError(null);
		}
	};

	const resetForm = () => {
		setSessionDate(undefined);
		setSessionTime("10:00");
		setSessionType("regular");
		setError(null);
		setIsSubmitting(false);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		// Block closing while submitting
		if (isSubmitting) return;
		if (!nextOpen) resetForm();
		onOpenChange(nextOpen);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const validationError = getSessionValidationError(
				sessionDate,
				sessionTime,
			);
			if (validationError) {
				setError(validationError);
				setIsSubmitting(false);
				return;
			}

			if (!sessionDate) {
				setError("Please select a session date");
				setIsSubmitting(false);
				return;
			}

			const selectedDateInCalendar = formatIsoDateInPHT(sessionDate);
			if (!selectedDateInCalendar) {
				setError("Invalid session date");
				setIsSubmitting(false);
				return;
			}

			// Treat selected date+time as PHT and convert once to UTC for storage.
			const scheduleDate = buildPhtDateTimeAsUtc(
				selectedDateInCalendar,
				sessionTime,
			);

			const [err, data] = await api.sessions.create({
				scheduleDate: scheduleDate.toISOString(),
				type: sessionType as "regular" | "special",
			});

			if (err) {
				// Always try to use server error message (e.g. "A session already exists for this date.")
				const serverMessage = isDefinedError(err)
					? err.message
					: (err as { message?: string })?.message;
				setError(
					serverMessage || "Failed to create session. Please try again.",
				);
				setIsSubmitting(false);
				return;
			}

			// Notify parent before closing so fetchSessions runs while dialog is still mounted
			if (onSessionCreated && data) {
				onSessionCreated(data.id);
			}
			handleOpenChange(false);
		} catch {
			setError("Failed to create session. Please try again.");
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="max-w-lg border border-gray-200 shadow-sm"
				showCloseButton={!isSubmitting}
				onInteractOutside={(e) => {
					if (isSubmitting) e.preventDefault();
				}}
				onEscapeKeyDown={(e) => {
					if (isSubmitting) e.preventDefault();
				}}
			>
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
							<Plus className="h-5 w-5 text-blue-600" aria-hidden="true" />
						</div>
						<div>
							<DialogTitle className="text-xl font-semibold text-gray-900">
								Create New Session
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-0.5">
								Schedule a new council session
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Form */}
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
						{/* Session Type */}
						<div className="space-y-2">
							<label
								id={sessionTypeLabelId}
								htmlFor={sessionTypeSelectId}
								className="text-sm font-medium text-gray-700"
							>
								Session Type
							</label>
							<Select
								value={sessionType}
								onValueChange={handleSessionTypeChange}
							>
								<SelectTrigger
									id={sessionTypeSelectId}
									aria-labelledby={sessionTypeLabelId}
									className="cursor-pointer border-gray-400 bg-white text-sm font-medium text-gray-900 focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="regular" className="cursor-pointer">
										Regular Session
									</SelectItem>
									<SelectItem value="special" className="cursor-pointer">
										Special Session
									</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-gray-500">
								Regular sessions are held weekly
							</p>
						</div>

						{/* Session Date */}
						<div className="space-y-2">
							<label
								htmlFor={sessionDatePickerId}
								id={sessionDateLabelId}
								className="text-sm font-medium text-gray-700"
							>
								Session Date <span className="text-red-500">*</span>
							</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id={sessionDatePickerId}
										aria-labelledby={sessionDateLabelId}
										variant="outline"
										className="w-full justify-start border-gray-400 bg-white text-left text-sm font-medium text-gray-900 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
									>
										<Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
										{sessionDate ? format(sessionDate, "PPP") : "Pick a date"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<CalendarComponent
										mode="single"
										selected={sessionDate}
										onSelect={handleSessionDateChange}
										disabled={(date) => {
											const dateInPht = formatIsoDateInPHT(date);
											return !dateInPht || dateInPht < todayInPht;
										}}
										classNames={{
											today: "bg-transparent text-yellow-400 font-normal",
											day_selected:
												"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
										}}
									/>
								</PopoverContent>
							</Popover>{" "}
							<p className="text-xs text-gray-500">
								Only today and future dates can be selected
							</p>
						</div>

						{/* Session Time */}
						<div className="space-y-2">
							<label
								htmlFor={sessionTimePickerId}
								id={sessionTimeLabelId}
								className="text-sm font-medium text-gray-700"
							>
								Session Time
							</label>
							<TimePicker
								id={sessionTimePickerId}
								aria-labelledby={sessionTimeLabelId}
								value={sessionTime}
								onChange={handleSessionTimeChange}
								placeholder="Select session time"
								className="border-gray-400 bg-white text-sm font-medium text-gray-900 focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
							/>
							<p className="text-xs text-gray-500">
								Default: 10:00 AM (regular sessions)
							</p>
						</div>

						{/* Error Message */}
						{error && (
							<div
								className="rounded-lg border border-red-200 bg-red-50 p-3"
								role="alert"
								aria-live="polite"
							>
								<p className="text-sm text-red-800">{error}</p>
							</div>
						)}
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isSubmitting}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
						>
							{isSubmitting ? (
								<Loader2
									className="h-4 w-4 mr-2 animate-spin"
									aria-hidden="true"
								/>
							) : (
								<Plus className="h-4 w-4 mr-2" aria-hidden="true" />
							)}
							{isSubmitting ? "Creating..." : "Create Session"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
