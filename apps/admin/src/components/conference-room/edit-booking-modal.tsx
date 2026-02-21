"use client";

import type { ConferenceRoom } from "@repo/shared";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpdateBooking } from "@/hooks/room-booking";
import {
	BookingFormFields,
	type BookingFormValues,
} from "./booking-form-fields";

export interface EditBookingData {
	id: string;
	title: string;
	requestedFor: string;
	room: ConferenceRoom;
	date: Date;
	/** "HH:MM" 24-hour local time */
	startTime: string;
	/** "HH:MM" 24-hour local time */
	endTime: string;
	attachmentUrl: string | null;
}

interface EditBookingModalProps {
	isOpen: boolean;
	onClose: () => void;
	booking: EditBookingData | null;
}

export function EditBookingModal({
	isOpen,
	onClose,
	booking,
}: EditBookingModalProps) {
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
	const [removeExistingAttachment, setRemoveExistingAttachment] =
		useState(false);

	const { updateBooking, isUpdating, error, clearError } = useUpdateBooking(
		() => {
			onClose();
		},
	);

	// Populate form when modal opens with booking data
	useEffect(() => {
		if (!isOpen || !booking) return;
		clearError();
		setFileError(null);

		setValues({
			room: booking.room,
			date: booking.date,
			startTime: booking.startTime,
			endTime: booking.endTime,
			title: booking.title,
			requestedFor: booking.requestedFor,
			attachment: null,
			removeExistingAttachment: false,
		});
		setRemoveExistingAttachment(false);
	}, [isOpen, booking]);

	const handleChange = (field: keyof BookingFormValues, value: unknown) => {
		if (field === "attachment" && value) {
			setRemoveExistingAttachment(false);
		}
		setValues((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!booking ||
			!values.date ||
			!values.room ||
			!values.startTime ||
			!values.endTime
		)
			return;

		await updateBooking({
			id: booking.id,
			title: values.title,
			date: values.date,
			startTime: values.startTime,
			endTime: values.endTime,
			requestedFor: values.requestedFor,
			room: values.room as ConferenceRoom,
			...(removeExistingAttachment && !values.attachment
				? { attachmentUrl: null }
				: {}),
			...(values.attachment ? { attachmentFile: values.attachment } : {}),
		});
	};

	if (!isOpen || !booking) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">Edit Booking</h2>
						<p className="text-sm text-gray-500 mt-1">
							Update the booking details below
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-md transition-colors"
						disabled={isUpdating}
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto px-6 py-6 min-h-0"
				>
					<BookingFormFields
						key={`${booking.id}-${booking.room}`}
						values={values}
						onChange={handleChange}
						existingAttachmentUrl={booking.attachmentUrl}
						removeExistingAttachment={removeExistingAttachment}
						onRemoveExistingAttachmentChange={setRemoveExistingAttachment}
						error={error}
						fileError={fileError}
						onFileError={setFileError}
					/>

					{/* Buttons */}
					<div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							disabled={isUpdating}
							className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isUpdating}
							className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-70"
						>
							{isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
							{isUpdating ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
