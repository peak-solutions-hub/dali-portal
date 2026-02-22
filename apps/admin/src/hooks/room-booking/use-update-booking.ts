"use client";

import type { AttachmentMimeType, ConferenceRoom } from "@repo/shared";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useInvalidateRoomBookings } from "./use-room-bookings";

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
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const invalidate = useInvalidateRoomBookings();
	const clearError = useCallback(() => setError(null), []);

	const updateBooking = useCallback(
		async (input: UpdateBookingInput): Promise<{ success: boolean }> => {
			setIsUpdating(true);
			setError(null);

			try {
				let attachmentUrl = input.attachmentUrl;

				if (input.attachmentFile) {
					const mimeType = inferAttachmentMimeType(input.attachmentFile.name);
					const [uploadErr, uploadData] =
						await api.roomBookings.generateUploadUrl({
							fileName: input.attachmentFile.name,
							mimeType,
						});

					if (uploadErr || !uploadData) {
						const message =
							uploadErr?.message || "Failed to generate upload URL";
						setError(message);
						toast.error(message);
						return { success: false };
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
						const message = `Failed to upload attachment (${uploadResponse.status})`;
						setError(message);
						toast.error(message);
						return { success: false };
					}

					attachmentUrl = uploadData.path;
				}

				const [err] = await api.roomBookings.update({
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
					const message = err.message || "Failed to update booking";
					setError(message);
					toast.error(message);
					return { success: false };
				}

				toast.success("Booking updated successfully");
				await invalidate();
				onSuccess?.();
				return { success: true };
			} catch {
				const message = "An unexpected error occurred";
				setError(message);
				toast.error(message);
				return { success: false };
			} finally {
				setIsUpdating(false);
			}
		},
		[invalidate, onSuccess],
	);

	return { updateBooking, isUpdating, error, clearError };
}
