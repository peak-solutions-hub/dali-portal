"use client";

import type {
	AttachmentMimeType,
	ConferenceRoom,
	RoomBookingListResponse,
	RoomBookingResponse,
} from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api, orpc } from "@/lib/api.client";

export interface UpdateBookingInput {
	id: string;
	title?: string;
	date?: Date;
	startTime?: string;
	endTime?: string;
	requestedFor?: string;
	room?: ConferenceRoom;
	attachmentFile?: File;
	attachmentUrl?: string | null;
}

function toISODateTime(date: Date, timeStr: string): string {
	const parts = timeStr.split(":");
	const hours = Number(parts[0] ?? 0);
	const minutes = Number(parts[1] ?? 0);
	const d = new Date(date);
	d.setHours(hours, minutes, 0, 0);
	return d.toISOString();
}

function inferAttachmentMimeType(fileName: string): AttachmentMimeType {
	const extension = fileName.split(".").pop()?.toLowerCase();

	if (extension === "pdf") return "application/pdf";
	if (extension === "jpeg") return "image/jpeg";
	if (extension === "jpg") return "image/jpg";

	throw new Error(
		"Unsupported attachment type. Please upload PDF or JPG/JPEG.",
	);
}

export function useUpdateBooking(onSuccess?: () => void) {
	const [error, setError] = useState<string | null>(null);
	const clearError = useCallback(() => setError(null), []);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (input: UpdateBookingInput) => {
			let attachmentUrl = input.attachmentUrl;

			if (input.attachmentFile) {
				const mimeType = inferAttachmentMimeType(input.attachmentFile.name);
				const [uploadErr, uploadData] =
					await api.roomBookings.generateUploadUrl({
						fileName: input.attachmentFile.name,
						mimeType,
						fileSize: input.attachmentFile.size,
					});

				if (uploadErr || !uploadData) {
					throw new Error(
						uploadErr?.message || "Failed to generate upload URL",
					);
				}

				const uploadResponse = await fetch(uploadData.uploadUrl, {
					method: "PUT",
					headers: {
						"Content-Type":
							input.attachmentFile.type || "application/octet-stream",
					},
					body: input.attachmentFile,
				});

				if (!uploadResponse.ok) {
					throw new Error(
						`Failed to upload attachment (${uploadResponse.status})`,
					);
				}

				attachmentUrl = uploadData.path;
			}

			const [err, data] = await api.roomBookings.update({
				id: input.id,
				...(input.title !== undefined && { title: input.title }),
				...(input.date &&
					input.startTime && {
						startTime: toISODateTime(input.date, input.startTime),
					}),
				...(input.date &&
					input.endTime && {
						endTime: toISODateTime(input.date, input.endTime),
					}),
				...(input.requestedFor !== undefined && {
					requestedFor: input.requestedFor,
				}),
				...(input.room !== undefined && { room: input.room }),
				...(attachmentUrl !== undefined && { attachmentUrl }),
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
									...(updatedBooking.date &&
										updatedBooking.startTime && {
											startTime: toISODateTime(
												updatedBooking.date,
												updatedBooking.startTime,
											),
										}),
									...(updatedBooking.date &&
										updatedBooking.endTime && {
											endTime: toISODateTime(
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
									...(updatedBooking.attachmentUrl !== undefined && {
										attachmentUrl: updatedBooking.attachmentUrl,
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
