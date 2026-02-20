"use client";

import { isDefinedError } from "@orpc/client";
import type { InquiryMessageResponse } from "@repo/shared";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseSendTicketMessageOptions {
	/** Callback when message is sent successfully */
	onSuccess?: (message: InquiryMessageResponse) => void;
	/** Callback when an error occurs */
	onError?: (error: string) => void;
	/** Upload progress callback (0-100) */
	onUploadProgress?: (progress: number) => void;
}

export interface UseSendTicketMessageReturn {
	/** Send a message */
	send: (params: {
		ticketId: string;
		message: string;
		files: File[];
		uploadFiles: () => Promise<string[]>;
		senderName: string;
	}) => Promise<{ success: boolean; message?: InquiryMessageResponse }>;
	/** Loading state */
	isSending: boolean;
	/** Manually set sending state */
	setIsSending: (value: boolean) => void;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for sending inquiry ticket messages (staff replies)
 * Handles API calls, file uploads, error handling, and loading states
 */
export function useSendTicketMessage(
	options?: UseSendTicketMessageOptions,
): UseSendTicketMessageReturn {
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsSending(false);
		setError(null);
	}, []);

	const send = useCallback(
		async ({
			ticketId,
			message,
			files,
			uploadFiles,
			senderName,
		}: {
			ticketId: string;
			message: string;
			files: File[];
			uploadFiles: () => Promise<string[]>;
			senderName: string;
		}): Promise<{ success: boolean; message?: InquiryMessageResponse }> => {
			if ((!message.trim() && files.length === 0) || !ticketId) {
				return { success: false };
			}

			setIsSending(true);
			setError(null);
			options?.onUploadProgress?.(10);

			try {
				let attachmentPaths: string[] = [];
				if (files.length > 0) {
					options?.onUploadProgress?.(40);
					attachmentPaths = await uploadFiles();
					options?.onUploadProgress?.(80);
				}

				const [err, result] = await api.inquiries.sendMessage({
					ticketId,
					content: message.trim() || "(Attachment)",
					senderName,
					senderType: "staff",
					attachmentPaths:
						attachmentPaths.length > 0 ? attachmentPaths : undefined,
				});

				if (err) {
					const errorMessage = isDefinedError(err)
						? err.message
						: "Failed to send message";
					setError(errorMessage);
					options?.onError?.(errorMessage);
					toast.error(errorMessage);
					return { success: false };
				}

				if (result) {
					toast.success("Message sent successfully");
					options?.onSuccess?.(result);
					return { success: true, message: result };
				}

				setError("Unexpected response from server");
				return { success: false };
			} catch (e) {
				const errorMessage =
					e instanceof Error
						? e.message
						: "An error occurred while sending message";
				console.error(e);
				setError(errorMessage);
				options?.onError?.(errorMessage);
				toast.error(errorMessage);
				return { success: false };
			} finally {
				setIsSending(false);
				options?.onUploadProgress?.(0);
			}
		},
		[options],
	);

	return {
		send,
		isSending,
		setIsSending,
		error,
		clearError,
		reset,
	};
}
