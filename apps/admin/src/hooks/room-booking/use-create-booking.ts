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
	isUploadingAttachment: boolean;
	uploadProgress: number | null;
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

function uploadFileWithProgress(
	uploadUrl: string,
	file: File,
	onProgress: (progressPercent: number) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", uploadUrl);
		xhr.setRequestHeader(
			"Content-Type",
			file.type || "application/octet-stream",
		);

		xhr.upload.onprogress = (event) => {
			if (!event.lengthComputable) {
				return;
			}

			const progress = Math.round((event.loaded / event.total) * 100);
			onProgress(progress);
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				onProgress(100);
				resolve();
				return;
			}

			reject(new Error(`Failed to upload attachment (${xhr.status})`));
		};

		xhr.onerror = () => {
			reject(new Error("Failed to upload attachment. Please try again."));
		};

		xhr.send(file);
	});
}

export function useCreateBooking(
	onSuccess?: () => void,
): UseCreateBookingReturn {
	const [error, setError] = useState<string | null>(null);
	const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const clearError = useCallback(() => setError(null), []);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (input: CreateBookingInput) => {
			let attachmentUrl: string | undefined;

			if (input.attachmentFile) {
				const mimeType = inferAttachmentMimeType(input.attachmentFile);
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

				setIsUploadingAttachment(true);
				setUploadProgress(0);
				await uploadFileWithProgress(
					uploadData.uploadUrl,
					input.attachmentFile,
					(progressPercent) => {
						setUploadProgress(progressPercent);
					},
				);
				setIsUploadingAttachment(false);

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
			setIsUploadingAttachment(false);
			setUploadProgress(null);
			setError(err.message);
			toast.error(err.message);
		},
		onSuccess: () => {
			setUploadProgress(null);
			toast.success("Booking created successfully");
			onSuccess?.();
		},
		onSettled: () => {
			setIsUploadingAttachment(false);
			queryClient.invalidateQueries({
				queryKey: orpc.roomBookings.getList.key(),
			});
		},
	});

	const createBooking = useCallback(
		async (input: CreateBookingInput): Promise<{ success: boolean }> => {
			setError(null);
			setUploadProgress(null);
			try {
				await mutation.mutateAsync(input);
				return { success: true };
			} catch {
				return { success: false };
			}
		},
		[mutation],
	);

	return {
		createBooking,
		isCreating: mutation.isPending,
		isUploadingAttachment,
		uploadProgress,
		error,
		clearError,
	};
}
