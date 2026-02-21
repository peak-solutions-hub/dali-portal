"use client";

import { isDefinedError } from "@orpc/client";
import type { AttachmentMimeType, ConferenceRoom } from "@repo/shared";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useInvalidateRoomBookings } from "./use-room-bookings";

export interface CreateBookingInput {
	title: string;
	/** The booking date (only date part is used alongside startTime/endTime) */
	date: Date;
	/** "HH:MM" 24-hour local time */
	startTime: string;
	/** "HH:MM" 24-hour local time */
	endTime: string;
	requestedFor: string;
	room: ConferenceRoom;
	/** Optional attachment file to upload before creating the booking */
	attachmentFile?: File;
}

export interface UseCreateBookingReturn {
	createBooking: (input: CreateBookingInput) => Promise<{ success: boolean }>;
	isCreating: boolean;
	error: string | null;
	clearError: () => void;
}

/** Convert a local date + "HH:MM" string to an ISO 8601 UTC datetime string. */
function toISODateTime(date: Date, timeStr: string): string {
	const parts = timeStr.split(":");
	const hours = Number(parts[0] ?? 0);
	const minutes = Number(parts[1] ?? 0);
	const d = new Date(date);
	d.setHours(hours, minutes, 0, 0);
	return d.toISOString();
}

export function useCreateBooking(
	onSuccess?: () => void,
): UseCreateBookingReturn {
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const invalidate = useInvalidateRoomBookings();

	const clearError = useCallback(() => setError(null), []);

	const createBooking = useCallback(
		async (input: CreateBookingInput): Promise<{ success: boolean }> => {
			setIsCreating(true);
			setError(null);

			try {
				let attachmentUrl: string | undefined;

				// Step 1 — Upload attachment if provided
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

				// Step 2 — Create booking
				const [err] = await api.roomBookings.create({
					title: input.title,
					startTime: toISODateTime(input.date, input.startTime),
					endTime: toISODateTime(input.date, input.endTime),
					requestedFor: input.requestedFor,
					room: input.room,
					...(attachmentUrl ? { attachmentUrl } : {}),
				});

				if (err) {
					const msg = err.message || "Failed to create booking";
					setError(msg);
					toast.error(msg);
					return { success: false };
				}

				toast.success("Booking created successfully");
				await invalidate();
				onSuccess?.();
				return { success: true };
			} catch {
				const msg = "An unexpected error occurred";
				setError(msg);
				toast.error(msg);
				return { success: false };
			} finally {
				setIsCreating(false);
			}
		},
		[invalidate, onSuccess],
	);

	return { createBooking, isCreating, error, clearError };
}
