"use client";

import { isDefinedError } from "@orpc/client";
import type { AttachmentMimeType, ConferenceRoom } from "@repo/shared";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useInvalidateRoomBookings } from "./use-room-bookings";

export interface UpdateBookingInput {
	id: string;
	title?: string;
	date?: Date;
	startTime?: string; // "HH:MM" 24-hour
	endTime?: string; // "HH:MM" 24-hour
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
					const file = input.attachmentFile;
					const [uploadErr, uploadData] =
						await api.roomBookings.generateUploadUrl({
							fileName: file.name,
							mimeType: file.type as AttachmentMimeType,
						});
					if (uploadErr) {
						const msg = isDefinedError(uploadErr)
							? uploadErr.message
							: "Failed to generate upload URL";
						setError(msg);
						toast.error(msg);
						return { success: false };
					}
					const uploadResponse = await fetch(uploadData!.uploadUrl, {
						method: "PUT",
						body: file,
						headers: { "Content-Type": file.type },
					});
					if (!uploadResponse.ok) {
						const msg = "Failed to upload attachment";
						setError(msg);
						toast.error(msg);
						return { success: false };
					}
					attachmentUrl = uploadData!.path;
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
					const msg = err.message || "Failed to update booking";
					setError(msg);
					toast.error(msg);
					return { success: false };
				}

				toast.success("Booking updated successfully");
				await invalidate();
				onSuccess?.();
				return { success: true };
			} catch {
				const msg = "An unexpected error occurred";
				setError(msg);
				toast.error(msg);
				return { success: false };
			} finally {
				setIsUpdating(false);
			}
		},
		[invalidate, onSuccess],
	);

	return { updateBooking, isUpdating, error, clearError };
}
