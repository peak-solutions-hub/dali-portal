"use client";

import { TEXT_LIMITS } from "@repo/shared";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { parseDisplayDateToInput } from "@/utils/date-utils";
import { formatTimeToInput } from "@/utils/time-utils";

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
	const [date, setDate] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [title, setTitle] = useState("");
	const [attachment, setAttachment] = useState<File | null>(null);

	// Parse selected time and date when modal opens
	useEffect(() => {
		if (isOpen) {
			// If selected date is provided (from calendar), use it; otherwise default to today
			if (selectedDate) {
				// Convert display date to YYYY-MM-DD format for date input
				const displayDate = parseDisplayDateToInput(selectedDate);
				// Parse MM/DD/YYYY to YYYY-MM-DD
				const [month, day, year] = displayDate.split("/");
				if (month && day && year) {
					setDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
				} else {
					// Fallback to today if parsing fails
					const today = new Date();
					const y = today.getFullYear();
					const m = String(today.getMonth() + 1).padStart(2, "0");
					const d = String(today.getDate()).padStart(2, "0");
					setDate(`${y}-${m}-${d}`);
				}
			} else {
				// Set to current date in YYYY-MM-DD format for date input
				const today = new Date();
				const year = today.getFullYear();
				const month = String(today.getMonth() + 1).padStart(2, "0");
				const day = String(today.getDate()).padStart(2, "0");
				setDate(`${year}-${month}-${day}`);
			}

			if (selectedTime.includes(" - ")) {
				const [start, end] = selectedTime.split(" - ");
				if (start && end) {
					setStartTime(formatTimeToInput(start.trim()));
					setEndTime(formatTimeToInput(end.trim()));
				}
			}
		}
	}, [isOpen, selectedDate, selectedTime]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Booking submitted:", {
			date,
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
			setAttachment(file);
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
					{/* Date */}
					<div>
						<label
							htmlFor="date"
							className="block text-sm font-semibold text-gray-900 mb-2"
						>
							Date <span className="text-red-500">*</span>
						</label>
						<input
							id="date"
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="w-full px-4 py-3 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
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
								type="text"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="08:00 AM"
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
								type="text"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="09:00 AM"
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
						<input
							id="attachment"
							type="file"
							accept=".jpg,.jpeg,.pdf"
							onChange={handleFileChange}
							className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
						/>
						{attachment && (
							<p className="text-sm text-gray-600 mt-2">
								Selected: {attachment.name}
							</p>
						)}
						<p className="text-xs text-gray-500 mt-1">
							Accepted formats: JPG, PDF
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
