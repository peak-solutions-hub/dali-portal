"use client";

import {
	CONFERENCE_ROOM_OPTIONS,
	type ConferenceRoom,
	isPastDateTime,
	parseTimeToMinutes,
} from "@repo/shared";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	type CreateBookingInput,
	useCreateBooking,
} from "@/hooks/room-booking/use-create-booking";
import { useRoomBookings } from "@/hooks/room-booking/use-room-bookings";
import { mapApiBookings } from "@/utils/booking-helpers";
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
	type BookingFieldErrors = Partial<Record<keyof BookingFormValues, string>>;

	const [values, setValues] = useState<BookingFormValues>({
		room: "",
		date: undefined,
		startTime: "",
		endTime: "",
		meetingType: "",
		meetingTypeOthers: "",
		title: "",
		requestedFor: "",
		attachments: [],
	});
	const [fileError, setFileError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});

	const currentDate = values.date ?? selectedDate;
	const { data: dateBookingsData } = useRoomBookings(currentDate);

	const {
		createBooking,
		isCreating,
		isUploadingAttachment,
		uploadProgress,
		uploadedAttachmentCount,
		totalAttachmentCount,
		error,
		clearError,
	} = useCreateBooking(() => {
		onClose();
	});

	const roomAvailability = useMemo(() => {
		const startMinutes = parseTimeToMinutes(values.startTime);
		const endMinutes = parseTimeToMinutes(values.endTime);

		const empty: Partial<
			Record<ConferenceRoom, { disabled: boolean; note?: string }>
		> = {};

		if (
			startMinutes === null ||
			endMinutes === null ||
			startMinutes >= endMinutes
		) {
			return empty;
		}

		const bookings = dateBookingsData?.bookings
			? mapApiBookings(dateBookingsData.bookings)
			: [];

		for (const roomOption of CONFERENCE_ROOM_OPTIONS) {
			const roomBookings = bookings.filter(
				(booking) =>
					booking.roomKey === roomOption.value &&
					(booking.status === "confirmed" || booking.status === "pending"),
			);

			const overlapping = roomBookings.filter((booking) => {
				const bookingStart = parseTimeToMinutes(booking.startTime24);
				const bookingEnd = parseTimeToMinutes(booking.endTime24);
				if (bookingStart === null || bookingEnd === null) return false;
				return startMinutes < bookingEnd && endMinutes > bookingStart;
			});

			if (overlapping.length > 0) {
				const first = overlapping[0];
				if (!first) continue;
				const moreCount = overlapping.length - 1;
				empty[roomOption.value] = {
					disabled: true,
					note:
						moreCount > 0
							? `Booked at ${first.startTime} - ${first.endTime} (+${moreCount} more)`
							: `Booked at ${first.startTime} - ${first.endTime}`,
				};
			}
		}

		return empty;
	}, [dateBookingsData, values.startTime, values.endTime]);

	const selectedRoomConflict = useMemo(() => {
		if (!values.room) {
			return null;
		}

		return roomAvailability[values.room as ConferenceRoom] ?? null;
	}, [roomAvailability, values.room]);

	// Populate form on open
	useEffect(() => {
		if (!isOpen) return;
		clearError();
		setFileError(null);
		setFieldErrors({});

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
			meetingType: "",
			meetingTypeOthers: "",
			title: "",
			requestedFor: "",
			attachments: [],
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	const validateForm = (): BookingFieldErrors => {
		const errors: BookingFieldErrors = {};

		if (!values.room) {
			errors.room = "Conference room is required.";
		} else if (selectedRoomConflict?.disabled) {
			errors.room = selectedRoomConflict.note
				? `Selected room is occupied for this schedule (${selectedRoomConflict.note}). Please choose another room or timeslot.`
				: "Selected room is occupied for this schedule. Please choose another room or timeslot.";
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

		if (!values.meetingType) {
			errors.meetingType = "Meeting type is required.";
		}

		if (values.meetingType === "others" && !values.meetingTypeOthers.trim()) {
			errors.meetingTypeOthers = "Please specify the meeting type.";
		}

		if (!values.requestedFor.trim()) {
			errors.requestedFor = "Requested for is required.";
		}

		const startMinutes = parseTimeToMinutes(values.startTime);
		const endMinutes = parseTimeToMinutes(values.endTime);
		if (
			startMinutes !== null &&
			endMinutes !== null &&
			endMinutes <= startMinutes
		) {
			errors.endTime = "End time must be later than start time.";
		}

		const EIGHT_AM_MINUTES = 8 * 60; // 480
		const FIVE_PM_MINUTES = 17 * 60; // 1020

		if (
			startMinutes !== null &&
			(startMinutes < EIGHT_AM_MINUTES || startMinutes > FIVE_PM_MINUTES)
		) {
			errors.startTime = "Start time must be between 8:00 AM and 5:00 PM.";
		}
		if (
			endMinutes !== null &&
			(endMinutes < EIGHT_AM_MINUTES || endMinutes > FIVE_PM_MINUTES)
		) {
			errors.endTime = "End time must be between 8:00 AM and 5:00 PM.";
		}

		if (
			values.date &&
			values.startTime &&
			isPastDateTime(values.date, values.startTime)
		) {
			errors.startTime = "Start time cannot be in the past.";
		}

		return errors;
	};

	const handleChange = (field: keyof BookingFormValues, value: unknown) => {
		setValues((prev) => ({ ...prev, [field]: value }));
		setFieldErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (fileError || isUploadingAttachment) {
			return;
		}

		const errors = validateForm();
		setFieldErrors(errors);
		if (Object.keys(errors).length > 0) {
			return;
		}

		if (!values.date) {
			return;
		}

		await createBooking({
			title: values.title.trim(),
			meetingType: values.meetingType as CreateBookingInput["meetingType"],
			...(values.meetingType === "others" && values.meetingTypeOthers.trim()
				? { meetingTypeOthers: values.meetingTypeOthers.trim() }
				: {}),
			date: values.date,
			startTime: values.startTime,
			endTime: values.endTime,
			requestedFor: values.requestedFor.trim(),
			room: values.room as ConferenceRoom,
			...(values.attachments.length > 0
				? { attachmentFiles: values.attachments }
				: {}),
		});
	};

	if (!isOpen) return null;

	const isSubmitDisabled =
		isCreating ||
		isUploadingAttachment ||
		Boolean(fileError) ||
		Boolean(selectedRoomConflict?.disabled);

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
						fieldErrors={fieldErrors}
						roomAvailability={roomAvailability}
						selectedRoomConflictNote={
							selectedRoomConflict?.disabled
								? (selectedRoomConflict.note ??
									"This room is occupied for the selected date and time.")
								: null
						}
						error={error}
						fileError={fileError}
						onFileError={setFileError}
						isUploadingAttachment={isUploadingAttachment}
						uploadProgress={uploadProgress}
						uploadedAttachmentCount={uploadedAttachmentCount}
						totalAttachmentCount={totalAttachmentCount}
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
							disabled={isSubmitDisabled}
							className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-70"
						>
							{isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
							{isUploadingAttachment
								? `Uploading attachment(s)${uploadProgress !== null ? ` (${uploadProgress}%)` : "..."}`
								: isCreating
									? "Submitting..."
									: "Submit Request"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
