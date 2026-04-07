"use client";

import {
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
import { uploadBookingAttachments } from "./use-booking-attachment-upload";

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
	existingAttachments?: Array<{ path: string; reason?: string }>;
	newAttachments?: Array<{ file: File; reason?: string }>;
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
			const existingAttachments = [
				...new Map(
					(input.existingAttachments ?? []).map((attachment) => [
						attachment.path,
						{
							path: attachment.path,
							reason: attachment.reason?.trim() || undefined,
						},
					]),
				).values(),
			];
			const attachments = [...existingAttachments];
			const maxAttachments = FILE_UPLOAD_PRESETS.ATTACHMENTS.maxFiles;
			const incomingFilesCount = input.newAttachments?.length ?? 0;

			if (attachments.length + incomingFilesCount > maxAttachments) {
				throw new Error(`Maximum of ${maxAttachments} attachments is allowed.`);
			}

			if (input.newAttachments && input.newAttachments.length > 0) {
				setIsUploadingAttachment(true);
				const uploadedAttachments = await uploadBookingAttachments(
					input.newAttachments,
					(progress) => {
						setUploadProgress(progress.overallProgress);
						setUploadedAttachmentCount(progress.uploadedCount);
						setTotalAttachmentCount(progress.totalCount);
					},
				);
				attachments.push(...uploadedAttachments);
				setIsUploadingAttachment(false);
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
				...(input.existingAttachments !== undefined ||
				input.newAttachments !== undefined
					? { attachments }
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
									...(updatedBooking.existingAttachments !== undefined && {
										attachments: booking.attachments.filter((attachment) =>
											updatedBooking.existingAttachments?.some(
												(existing) => existing.path === attachment.path,
											),
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
			setTotalAttachmentCount(input.newAttachments?.length ?? 0);
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
