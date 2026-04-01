"use client";

import type {
	AttachmentMimeType,
	ConferenceRoom,
	MeetingType,
	RoomBookingListResponse,
	RoomBookingResponse,
} from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api, orpc } from "@/lib/api.client";
import { toPhtIsoDateTime } from "@/utils/booking-helpers";

export interface UpdateBookingInput {
	id: string;
	title?: string;
	meetingType?: MeetingType;
	meetingTypeOthers?: string | null;
	date?: Date;
	startTime?: string;
	endTime?: string;
	requestedFor?: string;
	room?: ConferenceRoom;
	attachmentFiles?: File[];
	attachmentPaths?: string[];
}

function inferAttachmentMimeType(file: File): AttachmentMimeType {
	const mimeType = file.type.toLowerCase();
	if (
		mimeType === "application/pdf" ||
		mimeType === "image/jpeg" ||
		mimeType === "image/jpg" ||
		mimeType === "image/png" ||
		mimeType === "application/msword" ||
		mimeType ===
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return mimeType as AttachmentMimeType;
	}

	const extension = file.name.split(".").pop()?.toLowerCase();
	if (extension === "pdf") return "application/pdf";
	if (extension === "jpeg") return "image/jpeg";
	if (extension === "jpg") return "image/jpg";
	if (extension === "png") return "image/png";
	if (extension === "doc") return "application/msword";
	if (extension === "docx") {
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	}

	throw new Error(
		"Unsupported attachment type. Please upload PDF, PNG, JPG/JPEG, DOC, or DOCX.",
	);
}

export function useUpdateBooking(onSuccess?: () => void) {
	const [error, setError] = useState<string | null>(null);
	const clearError = useCallback(() => setError(null), []);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (input: UpdateBookingInput) => {
			const attachmentPaths = [...new Set(input.attachmentPaths ?? [])];

			if (input.attachmentFiles && input.attachmentFiles.length > 0) {
				for (const file of input.attachmentFiles) {
					const mimeType = inferAttachmentMimeType(file);
					const [uploadErr, uploadData] =
						await api.roomBookings.generateUploadUrl({
							fileName: file.name,
							mimeType,
							fileSize: file.size,
						});

					if (uploadErr || !uploadData) {
						throw new Error(
							uploadErr?.message || "Failed to generate upload URL",
						);
					}

					const uploadResponse = await fetch(uploadData.uploadUrl, {
						method: "PUT",
						headers: {
							"Content-Type": file.type || "application/octet-stream",
						},
						body: file,
					});

					if (!uploadResponse.ok) {
						throw new Error(
							`Failed to upload attachment (${uploadResponse.status})`,
						);
					}

					attachmentPaths.push(uploadData.path);
				}
			}

			const [err, data] = await api.roomBookings.update({
				id: input.id,
				...(input.title !== undefined && { title: input.title }),
				...(input.meetingType !== undefined && {
					meetingType: input.meetingType,
				}),
				...(input.meetingTypeOthers !== undefined && {
					meetingTypeOthers: input.meetingTypeOthers,
				}),
				...(input.date &&
					input.startTime && {
						startTime: toPhtIsoDateTime(input.date, input.startTime),
					}),
				...(input.date &&
					input.endTime && {
						endTime: toPhtIsoDateTime(input.date, input.endTime),
					}),
				...(input.requestedFor !== undefined && {
					requestedFor: input.requestedFor,
				}),
				...(input.room !== undefined && { room: input.room }),
				...(input.attachmentPaths !== undefined || attachmentPaths.length > 0
					? { attachmentPaths }
					: {}),
			});

			if (err) {
				throw new Error(err.message || "Failed to update booking");
			}

			return data;
		},
		onMutate: async (updatedBooking) => {
			await queryClient.cancelQueries({
				queryKey: orpc.roomBookings.getList.key(),
			});

			const previousQueries = queryClient.getQueriesData({
				queryKey: orpc.roomBookings.getList.key(),
			});

			queryClient.setQueriesData(
				{ queryKey: orpc.roomBookings.getList.key() },
				(old: RoomBookingListResponse | undefined) => {
					if (!old || !old.bookings) return old;
					return {
						...old,
						bookings: old.bookings.map((booking: RoomBookingResponse) => {
							if (booking.id === updatedBooking.id) {
								return {
									...booking,
									...(updatedBooking.title !== undefined && {
										title: updatedBooking.title,
									}),
									...(updatedBooking.meetingType !== undefined && {
										meetingType: updatedBooking.meetingType,
									}),
									...(updatedBooking.meetingTypeOthers !== undefined && {
										meetingTypeOthers: updatedBooking.meetingTypeOthers,
									}),
									...(updatedBooking.date &&
										updatedBooking.startTime && {
											startTime: toPhtIsoDateTime(
												updatedBooking.date,
												updatedBooking.startTime,
											),
										}),
									...(updatedBooking.date &&
										updatedBooking.endTime && {
											endTime: toPhtIsoDateTime(
												updatedBooking.date,
												updatedBooking.endTime,
											),
										}),
									...(updatedBooking.requestedFor !== undefined && {
										requestedFor: updatedBooking.requestedFor,
									}),
									...(updatedBooking.room !== undefined && {
										room: updatedBooking.room,
									}),
									...(updatedBooking.attachmentPaths !== undefined && {
										attachments: booking.attachments.filter((attachment) =>
											updatedBooking.attachmentPaths?.includes(attachment.path),
										),
									}),
								};
							}
							return booking;
						}),
					};
				},
			);

			return { previousQueries };
		},
		onError: (err, updatedBooking, context) => {
			setError(err.message);
			toast.error(err.message);
			if (context?.previousQueries) {
				context.previousQueries.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		onSuccess: () => {
			toast.success("Booking updated successfully");
			onSuccess?.();
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.roomBookings.getList.key(),
			});
		},
	});

	const updateBooking = useCallback(
		async (input: UpdateBookingInput): Promise<{ success: boolean }> => {
			setError(null);
			try {
				await mutation.mutateAsync(input);
				return { success: true };
			} catch {
				return { success: false };
			}
		},
		[mutation],
	);

	return { updateBooking, isUpdating: mutation.isPending, error, clearError };
}
