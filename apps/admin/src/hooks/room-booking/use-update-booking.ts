"use client";

import {
	AttachmentMimeType,
	ConferenceRoom,
	FILE_UPLOAD_PRESETS,
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

interface UseUpdateBookingReturn {
	updateBooking: (input: UpdateBookingInput) => Promise<{ success: boolean }>;
	isUpdating: boolean;
	isUploadingAttachment: boolean;
	uploadProgress: number | null;
	uploadedAttachmentCount: number;
	totalAttachmentCount: number;
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

export function useUpdateBooking(
	onSuccess?: () => void,
): UseUpdateBookingReturn {
	const [error, setError] = useState<string | null>(null);
	const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [uploadedAttachmentCount, setUploadedAttachmentCount] = useState(0);
	const [totalAttachmentCount, setTotalAttachmentCount] = useState(0);
	const clearError = useCallback(() => setError(null), []);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (input: UpdateBookingInput) => {
			const attachmentPaths = [...new Set(input.attachmentPaths ?? [])];
			const maxAttachments = FILE_UPLOAD_PRESETS.ATTACHMENTS.maxFiles;
			const incomingFilesCount = input.attachmentFiles?.length ?? 0;

			if (attachmentPaths.length + incomingFilesCount > maxAttachments) {
				throw new Error(`Maximum of ${maxAttachments} attachments is allowed.`);
			}

			if (input.attachmentFiles && input.attachmentFiles.length > 0) {
				const totalFiles = input.attachmentFiles.length;
				setIsUploadingAttachment(true);
				setUploadProgress(0);
				setUploadedAttachmentCount(0);
				setTotalAttachmentCount(totalFiles);

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
					setUploadedAttachmentCount(index + 1);
				}

				setIsUploadingAttachment(false);
				setUploadedAttachmentCount(totalFiles);
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
			setIsUploadingAttachment(false);
			setUploadProgress(null);
			setUploadedAttachmentCount(0);
			setTotalAttachmentCount(0);
			setError(err.message);
			toast.error(err.message);
			if (context?.previousQueries) {
				context.previousQueries.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		onSuccess: () => {
			setUploadProgress(null);
			setUploadedAttachmentCount(0);
			setTotalAttachmentCount(0);
			toast.success("Booking updated successfully");
			onSuccess?.();
		},
		onSettled: () => {
			setIsUploadingAttachment(false);
			setUploadProgress(null);
			setUploadedAttachmentCount(0);
			setTotalAttachmentCount(0);
			queryClient.invalidateQueries({
				queryKey: orpc.roomBookings.getList.key(),
			});
		},
	});

	const updateBooking = useCallback(
		async (input: UpdateBookingInput): Promise<{ success: boolean }> => {
			setError(null);
			setUploadProgress(null);
			setUploadedAttachmentCount(0);
			setTotalAttachmentCount(input.attachmentFiles?.length ?? 0);
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
		updateBooking,
		isUpdating: mutation.isPending,
		isUploadingAttachment,
		uploadProgress,
		uploadedAttachmentCount,
		totalAttachmentCount,
		error,
		clearError,
	};
}
