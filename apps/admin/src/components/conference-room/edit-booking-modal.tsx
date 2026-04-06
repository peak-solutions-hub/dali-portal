"use client";

import { type ConferenceRoom, FILE_UPLOAD_PRESETS } from "@repo/shared";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type UpdateBookingInput,
	useUpdateBooking,
} from "@/hooks/room-booking/use-update-booking";
import {
	type EditBookingData,
	isAttachmentLimitMessage,
	resolveConferenceRoom,
} from "@/utils/booking-helpers";
import {
	type BookingFieldErrors,
	validateBookingForm,
} from "@/utils/booking-validation";
import {
	BookingFormFields,
	type BookingFormValues,
} from "./booking-form-fields";

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
	const [existingAttachmentReasons, setExistingAttachmentReasons] = useState<
		Record<string, string>
	>({});

	const {
		updateBooking,
		isUpdating,
		isUploadingAttachment,
		uploadProgress,
		uploadedAttachmentCount,
		totalAttachmentCount,
		error,
		clearError,
	} = useUpdateBooking(() => {
		onClose();
	});

	const clearAttachmentLimitErrorsIfResolved = (nextRemovedPaths: string[]) => {
		if (!booking) {
			return;
		}

		const maxAttachments = FILE_UPLOAD_PRESETS.ATTACHMENTS.maxFiles;
		const keptExistingCount = booking.attachments.filter(
			(attachment) => !nextRemovedPaths.includes(attachment.path),
		).length;
		const totalAttachments = keptExistingCount + values.attachments.length;

		if (totalAttachments <= maxAttachments) {
			setFieldErrors((prev) => {
				if (!prev.attachments) {
					return prev;
				}

				const next = { ...prev };
				delete next.attachments;
				return next;
			});

			setFileError((prev) => {
				if (!prev) {
					return prev;
				}

				return isAttachmentLimitMessage(prev) ? null : prev;
			});
		}
	};

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
		setExistingAttachmentReasons(
			Object.fromEntries(
				booking.attachments.map((attachment) => [
					attachment.path,
					attachment.reason ?? "",
				]),
			),
		);
	}, [isOpen, booking, clearError]);

	const validateForm = (): BookingFieldErrors => {
		const maxAttachments = FILE_UPLOAD_PRESETS.ATTACHMENTS.maxFiles;
		const keptExistingCount = booking
			? booking.attachments.filter(
					(attachment) => !removedAttachmentPaths.includes(attachment.path),
				).length
			: 0;

		return validateBookingForm(values, {
			maxAttachments,
			keptExistingAttachmentCount: keptExistingCount,
		});
	};

	const handleChange = (field: keyof BookingFormValues, value: unknown) => {
		if (field === "room") {
			if (typeof value !== "string" || !value) return;
			setValues((prev) => ({
				...prev,
				room: resolveConferenceRoom(value),
			}));
		} else {
			if (field === "meetingType" && value !== "others") {
				setValues((prev) => ({
					...prev,
					meetingType: String(value),
					meetingTypeOthers: "",
				}));
				return;
			}
			setValues((prev) => ({ ...prev, [field]: value }));

			if (field === "attachments") {
				clearAttachmentLimitErrorsIfResolved(removedAttachmentPaths);
			}
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
			if (!booking || !isAttachmentLimitMessage(fileError)) {
				return;
			}

			const maxAttachments = FILE_UPLOAD_PRESETS.ATTACHMENTS.maxFiles;
			const keptExistingCount = booking.attachments.filter(
				(attachment) => !removedAttachmentPaths.includes(attachment.path),
			).length;
			const totalAttachments = keptExistingCount + values.attachments.length;

			if (totalAttachments > maxAttachments) {
				return;
			}

			setFileError(null);
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
			existingAttachments: booking.attachments
				.filter(
					(attachment) => !removedAttachmentPaths.includes(attachment.path),
				)
				.map((attachment) => ({
					path: attachment.path,
					reason:
						existingAttachmentReasons[attachment.path]?.trim() || undefined,
				})),
			...(values.attachments.length > 0
				? {
						newAttachments: values.attachments.map((attachment) => ({
							file: attachment.file,
							reason: attachment.reason.trim() || undefined,
						})),
					}
				: {}),
		});
	};

	if (!isOpen || !booking) return null;

	const isSubmitDisabled = isUpdating || isUploadingAttachment;

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
						disabled={isUpdating || isUploadingAttachment}
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
						existingAttachments={booking.attachments.map((attachment) => ({
							...attachment,
							reason: existingAttachmentReasons[attachment.path] ?? "",
						}))}
						onExistingAttachmentReasonChange={(path, reason) => {
							setExistingAttachmentReasons((prev) => ({
								...prev,
								[path]: reason,
							}));
							clearAttachmentLimitErrorsIfResolved(removedAttachmentPaths);
						}}
						removedExistingAttachmentPaths={removedAttachmentPaths}
						onToggleExistingAttachmentRemoval={(path) => {
							setRemovedAttachmentPaths((prev) => {
								const next = prev.includes(path)
									? prev.filter((value) => value !== path)
									: [...prev, path];
								clearAttachmentLimitErrorsIfResolved(next);
								return next;
							});
						}}
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
							disabled={isUpdating || isUploadingAttachment}
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
							{isUploadingAttachment
								? `Uploading attachment(s)${uploadProgress !== null ? ` (${uploadProgress}%)` : "..."}`
								: isUpdating
									? "Saving..."
									: "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
