"use client";

import { type AttachmentMimeType, type ConferenceRoom } from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api, orpc } from "@/lib/api.client";

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
	const [error, setError] = useState<string | null>(null);
	const clearError = useCallback(() => setError(null), []);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (input: CreateBookingInput) => {
			let attachmentUrl: string | undefined;

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

			const [err, data] = await api.roomBookings.create({
				title: input.title,
				startTime: toISODateTime(input.date, input.startTime),
				endTime: toISODateTime(input.date, input.endTime),
				requestedFor: input.requestedFor,
				room: input.room,
				...(attachmentUrl ? { attachmentUrl } : {}),
			});

			if (err) {
				throw new Error(err.message || "Failed to create booking");
			}

			return data;
		},
		onError: (err) => {
			setError(err.message);
			toast.error(err.message);
		},
		onSuccess: () => {
			toast.success("Booking created successfully");
			onSuccess?.();
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.roomBookings.getList.key(),
			});
		},
	});

	const createBooking = useCallback(
		async (input: CreateBookingInput): Promise<{ success: boolean }> => {
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

	return { createBooking, isCreating: mutation.isPending, error, clearError };
}
