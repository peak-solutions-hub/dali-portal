"use client";

import {
	type ConferenceRoom,
	isPastDateTime,
	parseTimeToMinutes,
} from "@repo/shared";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type UpdateBookingInput,
	useUpdateBooking,
} from "@/hooks/room-booking/use-update-booking";
import { resolveConferenceRoom } from "@/utils/booking-helpers";
import {
	BookingFormFields,
	type BookingFormValues,
} from "./booking-form-fields";

export interface EditBookingData {
	id: string;
	title: string;
	meetingType: string;
	meetingTypeOthers: string | null;
	requestedFor: string;
	room: string;
	date: Date;
	/** "HH:MM" 24-hour local time */
	startTime: string;
	/** "HH:MM" 24-hour local time */
	endTime: string;
	attachments: Array<{ path: string; url: string | null; fileName: string }>;
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
		meetingType: "",
		meetingTypeOthers: "",
		title: "",
		requestedFor: "",
		attachments: [],
	});
	const [fileError, setFileError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
	const [removedAttachmentPaths, setRemovedAttachmentPaths] = useState<
		string[]
	>([]);

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
			meetingType: booking.meetingType,
			meetingTypeOthers: booking.meetingTypeOthers ?? "",
			title: booking.title,
			requestedFor: booking.requestedFor,
			attachments: [],
		});
		setRemovedAttachmentPaths([]);
	}, [isOpen, booking]);

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
		if (field === "room") {
			if (typeof value !== "string" || !value) return;
			setValues((prev) => ({
				...prev,
				room: resolveConferenceRoom(value),
			}));
		} else {
			if (field === "attachments") {
				setRemovedAttachmentPaths((prev) =>
					prev.filter((path) =>
						booking?.attachments.some((attachment) => attachment.path === path),
					),
				);
			}

			if (field === "meetingType" && value !== "others") {
				setValues((prev) => ({
					...prev,
					meetingType: String(value),
					meetingTypeOthers: "",
				}));
				return;
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

		if (fileError) {
			return;
		}

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
			meetingType: values.meetingType as UpdateBookingInput["meetingType"],
			meetingTypeOthers:
				values.meetingType === "others"
					? values.meetingTypeOthers.trim() || null
					: null,
			date: values.date,
			startTime: values.startTime,
			endTime: values.endTime,
			requestedFor: values.requestedFor,
			room: values.room as ConferenceRoom,
			attachmentPaths: booking.attachments
				.filter(
					(attachment) => !removedAttachmentPaths.includes(attachment.path),
				)
				.map((attachment) => attachment.path),
			...(values.attachments.length > 0
				? { attachmentFiles: values.attachments }
				: {}),
		});
	};

	if (!isOpen || !booking) return null;

	const isSubmitDisabled = isUpdating || Boolean(fileError);

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
						existingAttachments={booking.attachments}
						removedExistingAttachmentPaths={removedAttachmentPaths}
						onToggleExistingAttachmentRemoval={(path) => {
							setRemovedAttachmentPaths((prev) =>
								prev.includes(path)
									? prev.filter((value) => value !== path)
									: [...prev, path],
							);
						}}
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
							disabled={isSubmitDisabled}
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
