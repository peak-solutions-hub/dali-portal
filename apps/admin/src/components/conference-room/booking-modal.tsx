"use client";

import { TEXT_LIMITS } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
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
import { cn } from "@repo/ui/lib/utils";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { parseDisplayDateToInput } from "@/utils/date-utils";
import { convertTo24HourFormat } from "@/utils/time-utils";

interface BookingModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedTime: string;
	selectedDate: string;
}

export function BookingModal({
	isOpen,
	onClose,
	selectedTime,
	selectedDate,
}: BookingModalProps) {
	const [date, setDate] = useState<Date | undefined>(undefined);
	const [room, setRoom] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [title, setTitle] = useState("");
	const [attachment, setAttachment] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);

	// Parse selected time and date when modal opens
	useEffect(() => {
		if (isOpen) {
			// If selected date is provided (from calendar), use it; otherwise default to today
			if (selectedDate) {
				// Convert display date to Date object
				const displayDate = parseDisplayDateToInput(selectedDate);
				// Parse MM/DD/YYYY to Date
				const [month, day, year] = displayDate.split("/");
				if (month && day && year) {
					setDate(new Date(Number(year), Number(month) - 1, Number(day)));
				} else {
					// Fallback to today if parsing fails
					setDate(new Date());
				}
			} else {
				// Set to current date
				setDate(new Date());
			}

			if (selectedTime.includes(" - ")) {
				const [start, end] = selectedTime.split(" - ");
				if (start && end) {
					setStartTime(convertTo24HourFormat(start.trim()));
					setEndTime(convertTo24HourFormat(end.trim()));
				}
			}
		}
	}, [isOpen, selectedDate, selectedTime]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!date) {
			return;
		}

		console.log("Booking submitted:", {
			date: date.toISOString(),
			room,
			startTime,
			endTime,
			title,
			attachment: attachment?.name,
		});
		onClose();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const maxSize = 10 * 1024 * 1024; // 10MB in bytes
			if (file.size > maxSize) {
				setFileError("File size must not exceed 10MB");
				setAttachment(null);
				e.target.value = ""; // Clear the input
			} else {
				setFileError(null);
				setAttachment(file);
			}
		}
	};

	const handleRemoveFile = () => {
		setAttachment(null);
		setFileError(null);
		const fileInput = document.getElementById("attachment") as HTMLInputElement;
		if (fileInput) {
			fileInput.value = "";
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">
							Request Room Booking
						</h2>
						<p className="text-sm text-gray-500 mt-1">
							Submit a room booking request
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-md transition-colors"
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
					{/* Conference Room */}
					<div>
						<label
							htmlFor="room"
							className="block text-sm font-semibold text-gray-900 mb-2"
						>
							Conference Room <span className="text-red-500">*</span>
						</label>
						<Select value={room} onValueChange={setRoom} required>
							<SelectTrigger className="w-full px-4 py-3 bg-gray-50 border-0 text-gray-900">
								<SelectValue placeholder="Select a conference room" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="4th-floor">
									4th Floor Conference Room
								</SelectItem>
								<SelectItem value="7th-floor">
									7th Floor Conference Room
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Date */}
					<div>
						<label
							htmlFor="date"
							className="block text-sm font-semibold text-gray-900 mb-2"
						>
							Date <span className="text-red-500">*</span>
						</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"w-full px-4 py-3 justify-start text-left font-normal border border-blue-500 hover:bg-gray-50",
										!date && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{date ? (
										date.toLocaleDateString("en-US", {
											month: "long",
											day: "numeric",
											year: "numeric",
										})
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={date}
									onSelect={setDate}
									disabled={(date) =>
										date < new Date(new Date().setHours(0, 0, 0, 0))
									}
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* Start Time and End Time */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="startTime"
								className="block text-sm font-semibold text-gray-900 mb-2"
							>
								Start Time <span className="text-red-500">*</span>
							</label>
							<input
								id="startTime"
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
						</div>
						<div>
							<label
								htmlFor="endTime"
								className="block text-sm font-semibold text-gray-900 mb-2"
							>
								End Time <span className="text-red-500">*</span>
							</label>
							<input
								id="endTime"
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
						</div>
					</div>

					{/* Title */}
					<div>
						<label
							htmlFor="title"
							className="block text-sm font-semibold text-gray-900 mb-2"
						>
							Title <span className="text-red-500">*</span>
						</label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength={TEXT_LIMITS.XS}
							className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter booking title..."
							required
						/>
						<p className="text-xs text-gray-500 mt-1">
							{title.length}/{TEXT_LIMITS.XS} characters
						</p>
					</div>

					{/* Attachment */}
					<div>
						<label
							htmlFor="attachment"
							className="block text-sm font-semibold text-gray-900 mb-2"
						>
							Attach Letter (Optional)
						</label>
						<div className="flex items-center gap-2">
							<div className="flex-1 relative">
								<input
									id="attachment"
									type="file"
									accept=".jpg,.jpeg,.pdf"
									onChange={handleFileChange}
									className="hidden"
								/>
								<label
									htmlFor="attachment"
									className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-semibold hover:bg-blue-100 cursor-pointer transition-colors"
								>
									Choose File
								</label>
								{attachment && (
									<span className="ml-3 text-sm text-gray-600">
										{attachment.name}
									</span>
								)}
							</div>
							{attachment && (
								<button
									type="button"
									onClick={handleRemoveFile}
									className="p-2 hover:bg-gray-100 rounded-md transition-colors shrink-0"
									aria-label="Remove file"
								>
									<X className="w-4 h-4 text-gray-500" />
								</button>
							)}
						</div>
						{fileError && (
							<p className="text-sm text-red-600 mt-2">{fileError}</p>
						)}
						<p className="text-xs text-gray-500 mt-1">
							Accepted formats: JPG, PDF (Max size: 10MB)
						</p>
					</div>

					{/* Buttons */}
					<div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-6 py-2.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
						>
							Submit Request
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
