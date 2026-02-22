"use client";

import type { ConferenceRoom } from "@repo/shared";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpdateBooking } from "@/hooks/room-booking/use-update-booking";
import { resolveConferenceRoom } from "@/utils/booking-helpers";
import {
	BookingFormFields,
	type BookingFormValues,
} from "./booking-form-fields";

export interface EditBookingData {
	id: string;
	title: string;
	requestedFor: string;
	room: string;
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
	type BookingFieldErrors = Partial<Record<keyof BookingFormValues, string>>;

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
	const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
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
		const resolvedRoom = resolveConferenceRoom(booking.room);
		clearError();
		setFileError(null);
		setFieldErrors({});

		setValues({
			room: resolvedRoom,
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

	const parseMinutes = (time: string): number | null => {
		if (!time || !time.includes(":")) return null;
		const [hoursRaw, minutesRaw] = time.split(":");
		const hours = Number(hoursRaw);
		const minutes = Number(minutesRaw);
		if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
		return hours * 60 + minutes;
	};

	const validateForm = (): BookingFieldErrors => {
		const errors: BookingFieldErrors = {};

		if (!values.room) {
			errors.room = "Conference room is required.";
		}
		if (!values.date) {
			errors.date = "Date is required.";
		}
		if (!values.startTime) {
			errors.startTime = "Start time is required.";
		}
		if (!values.endTime) {
			errors.endTime = "End time is required.";
		}
		if (!values.title.trim()) {
			errors.title = "Title is required.";
		}
		if (!values.requestedFor.trim()) {
			errors.requestedFor = "Requested for is required.";
		}

		const startMinutes = parseMinutes(values.startTime);
		const endMinutes = parseMinutes(values.endTime);
		if (
			startMinutes !== null &&
			endMinutes !== null &&
			endMinutes <= startMinutes
		) {
			errors.endTime = "End time must be later than start time.";
		}

		return errors;
	};

	const handleChange = (field: keyof BookingFormValues, value: unknown) => {
		if (field === "room") {
			if (typeof value !== "string" || !value) return;
			setValues((prev) => ({
				...prev,
				room: resolveConferenceRoom(value),
			}));
		} else {
			if (field === "attachment" && value) {
				setRemoveExistingAttachment(false);
			}
			setValues((prev) => ({ ...prev, [field]: value }));
		}

		setFieldErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const errors = validateForm();
		setFieldErrors(errors);
		if (Object.keys(errors).length > 0) {
			return;
		}

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
						fieldErrors={fieldErrors}
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
