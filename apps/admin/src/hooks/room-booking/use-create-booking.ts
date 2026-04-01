"use client";

import {
	type AttachmentMimeType,
	type ConferenceRoom,
	type MeetingType,
} from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api, orpc } from "@/lib/api.client";
import { toPhtIsoDateTime } from "@/utils/booking-helpers";

export interface CreateBookingInput {
	title: string;
	meetingType: MeetingType;
	meetingTypeOthers?: string;
	date: Date;
	startTime: string;
	endTime: string;
	requestedFor: string;
	room: ConferenceRoom;
	attachmentFiles?: File[];
}

export interface UseCreateBookingReturn {
	createBooking: (input: CreateBookingInput) => Promise<{ success: boolean }>;
	isCreating: boolean;
	isUploadingAttachment: boolean;
	uploadProgress: number | null;
	error: string | null;
	clearError: () => void;
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
			const attachmentPaths: string[] = [];

			if (input.attachmentFiles && input.attachmentFiles.length > 0) {
				const totalFiles = input.attachmentFiles.length;
				setIsUploadingAttachment(true);
				setUploadProgress(0);

				for (const [index, file] of input.attachmentFiles.entries()) {
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

					await uploadFileWithProgress(
						uploadData.uploadUrl,
						file,
						(progressPercent) => {
							const totalProgress = Math.round(
								((index + progressPercent / 100) / totalFiles) * 100,
							);
							setUploadProgress(totalProgress);
						},
					);

					attachmentPaths.push(uploadData.path);
				}

				setIsUploadingAttachment(false);
			}

			const [err, data] = await api.roomBookings.create({
				title: input.title,
				meetingType: input.meetingType,
				meetingTypeOthers: input.meetingTypeOthers,
				startTime: toPhtIsoDateTime(input.date, input.startTime),
				endTime: toPhtIsoDateTime(input.date, input.endTime),
				requestedFor: input.requestedFor,
				room: input.room,
				...(attachmentPaths.length > 0 ? { attachmentPaths } : {}),
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
