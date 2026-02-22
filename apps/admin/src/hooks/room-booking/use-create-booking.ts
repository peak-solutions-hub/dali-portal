"use client";

import type { AttachmentMimeType, ConferenceRoom } from "@repo/shared";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useInvalidateRoomBookings } from "./use-room-bookings";

export interface CreateBookingInput {
	title: string;
	date: Date;
	startTime: string;
	endTime: string;
	requestedFor: string;
	room: ConferenceRoom;
	attachmentFile?: File;
}

export interface UseCreateBookingReturn {
	createBooking: (input: CreateBookingInput) => Promise<{ success: boolean }>;
	isCreating: boolean;
	error: string | null;
	clearError: () => void;
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

				const [err] = await api.roomBookings.create({
					title: input.title,
					startTime: toISODateTime(input.date, input.startTime),
					endTime: toISODateTime(input.date, input.endTime),
					requestedFor: input.requestedFor,
					room: input.room,
					...(attachmentUrl ? { attachmentUrl } : {}),
				});

				if (err) {
					const message = err.message || "Failed to create booking";
					setError(message);
					toast.error(message);
					return { success: false };
				}

				toast.success("Booking created successfully");
				await invalidate();
				onSuccess?.();
				return { success: true };
			} catch {
				const message = "An unexpected error occurred";
				setError(message);
				toast.error(message);
				return { success: false };
			} finally {
				setIsCreating(false);
			}
		},
		[invalidate, onSuccess],
	);

	return { createBooking, isCreating, error, clearError };
}
