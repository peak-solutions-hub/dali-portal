"use client";

import type { ConferenceRoom } from "@repo/shared";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCreateBooking } from "@/hooks/room-booking";
import { convertTo24HourFormat } from "@/utils/time-utils";
import {
	BookingFormFields,
	type BookingFormValues,
} from "./booking-form-fields";

interface CreateBookingModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** Pre-selected time range, e.g. "9:00 AM - 10:00 AM" */
	selectedTime: string;
	/** The date for the new booking. */
	selectedDate: Date;
}

export function CreateBookingModal({
	isOpen,
	onClose,
	selectedTime,
	selectedDate,
}: CreateBookingModalProps) {
	const [values, setValues] = useState<BookingFormValues>({
		room: "",
		date: undefined,
		startTime: "",
		endTime: "",
		title: "",
		requestedFor: "",
		attachment: null,
	});
	const [fileError, setFileError] = useState<string | null>(null);

	const { createBooking, isCreating, error, clearError } = useCreateBooking(
		() => {
			onClose();
		},
	);

	// Populate form on open
	useEffect(() => {
		if (!isOpen) return;
		clearError();
		setFileError(null);

		let startTime = "";
		let endTime = "";
		if (selectedTime.includes(" - ")) {
			const [start, end] = selectedTime.split(" - ");
			if (start && end) {
				startTime = convertTo24HourFormat(start.trim());
				endTime = convertTo24HourFormat(end.trim());
			}
		}

		setValues({
			room: "",
			date: selectedDate,
			startTime,
			endTime,
			title: "",
			requestedFor: "",
			attachment: null,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	const handleChange = (field: keyof BookingFormValues, value: unknown) => {
		setValues((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!values.date || !values.room || !values.startTime || !values.endTime)
			return;

		await createBooking({
			title: values.title,
			date: values.date,
			startTime: values.startTime,
			endTime: values.endTime,
			requestedFor: values.requestedFor,
			room: values.room as ConferenceRoom,
			...(values.attachment ? { attachmentFile: values.attachment } : {}),
		});
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
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
						disabled={isCreating}
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto px-6 py-6 min-h-0"
				>
					<BookingFormFields
						values={values}
						onChange={handleChange}
						error={error}
						fileError={fileError}
						onFileError={setFileError}
					/>

					{/* Buttons */}
					<div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							disabled={isCreating}
							className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isCreating}
							className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-70"
						>
							{isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
							{isCreating ? "Submitting..." : "Submit Request"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
