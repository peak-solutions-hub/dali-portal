"use client";

import {
	type ConferenceRoom,
	FILE_UPLOAD_PRESETS,
	type MeetingType,
} from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api, orpc } from "@/lib/api.client";
import { toPhtIsoDateTime } from "@/utils/booking-helpers";
import { uploadBookingAttachments } from "./use-booking-attachment-upload";

export interface CreateBookingInput {
	title: string;
	meetingType: MeetingType;
	meetingTypeOthers?: string;
	date: Date;
	startTime: string;
	endTime: string;
	requestedFor: string;
	room: ConferenceRoom;
	attachments?: Array<{
		file: File;
		reason?: string;
	}>;
}

export interface UseCreateBookingReturn {
	createBooking: (input: CreateBookingInput) => Promise<{ success: boolean }>;
	isCreating: boolean;
	isUploadingAttachment: boolean;
	uploadProgress: number | null;
	uploadedAttachmentCount: number;
	totalAttachmentCount: number;
	error: string | null;
	clearError: () => void;
}

export function useCreateBooking(
	onSuccess?: () => void,
): UseCreateBookingReturn {
	const [error, setError] = useState<string | null>(null);
	const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [uploadedAttachmentCount, setUploadedAttachmentCount] = useState(0);
	const [totalAttachmentCount, setTotalAttachmentCount] = useState(0);
	const clearError = useCallback(() => setError(null), []);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (input: CreateBookingInput) => {
			let attachments: Array<{ path: string; reason?: string }> = [];
			const maxAttachments = FILE_UPLOAD_PRESETS.ATTACHMENTS.maxFiles;

			if ((input.attachments?.length ?? 0) > maxAttachments) {
				throw new Error(`Maximum of ${maxAttachments} attachments is allowed.`);
			}

			if (input.attachments && input.attachments.length > 0) {
				setIsUploadingAttachment(true);
				attachments = await uploadBookingAttachments(
					input.attachments,
					(progress) => {
						setUploadProgress(progress.overallProgress);
						setUploadedAttachmentCount(progress.uploadedCount);
						setTotalAttachmentCount(progress.totalCount);
					},
				);
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
				...(attachments.length > 0 ? { attachments } : {}),
			});

			if (err) {
				throw new Error(err.message || "Failed to create booking");
			}

			return data;
		},
		onError: (err) => {
			setIsUploadingAttachment(false);
			setUploadProgress(null);
			setUploadedAttachmentCount(0);
			setTotalAttachmentCount(0);
			setError(err.message);
			toast.error(err.message);
		},
		onSuccess: () => {
			setUploadProgress(null);
			setUploadedAttachmentCount(0);
			setTotalAttachmentCount(0);
			toast.success("Booking created successfully");
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

	const createBooking = useCallback(
		async (input: CreateBookingInput): Promise<{ success: boolean }> => {
			setError(null);
			setUploadProgress(null);
			setUploadedAttachmentCount(0);
			setTotalAttachmentCount(input.attachments?.length ?? 0);
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
		uploadedAttachmentCount,
		totalAttachmentCount,
		error,
		clearError,
	};
}
