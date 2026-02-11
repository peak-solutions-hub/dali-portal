"use client";

import { isDefinedError } from "@orpc/client";
import type {
	InquiryMessageResponse,
	SendInquiryMessageInput,
} from "@repo/shared";
import { useCallback, useState } from "react";
import { api } from "@/lib/api.client";

export interface UseSendInquiryMessageOptions {
	onSuccess?: (message: InquiryMessageResponse) => void;
	onError?: (error: string) => void;
}

export interface UseSendInquiryMessageReturn {
	/** Send a message */
	send: (
		data: Omit<SendInquiryMessageInput, "attachmentPaths">,
		attachmentPaths?: string[],
	) => Promise<{ success: boolean; message?: InquiryMessageResponse }>;
	/** Loading state */
	isSending: boolean;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for sending inquiry messages/replies
 * Handles API calls, error handling, and loading states
 */
export function useSendInquiryMessage(
	options?: UseSendInquiryMessageOptions,
): UseSendInquiryMessageReturn {
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsSending(false);
		setError(null);
	}, []);

	const send = useCallback(
		async (
			data: Omit<SendInquiryMessageInput, "attachmentPaths">,
			attachmentPaths?: string[],
		): Promise<{ success: boolean; message?: InquiryMessageResponse }> => {
			setIsSending(true);
			setError(null);

			try {
				// Filter valid attachment paths
				const validPaths = attachmentPaths?.filter(
					(path) => path && path.trim().length > 0,
				);

				const [err, response] = await api.inquiries.sendMessage({
					...data,
					attachmentPaths:
						validPaths && validPaths.length > 0 ? validPaths : undefined,
				});

				if (err) {
					let errorMessage = err.message;

					if (isDefinedError(err) && err.status === 429) {
						errorMessage =
							"You are sending messages too quickly. Please wait a moment before sending another message.";
					}

					setError(errorMessage);
					options?.onError?.(errorMessage);
					return { success: false };
				}

				if (response) {
					options?.onSuccess?.(response);
					return { success: true, message: response };
				}

				setError("Unexpected response from server.");
				return { success: false };
			} catch (e) {
				const errorMessage =
					e instanceof Error
						? e.message
						: "An unexpected error occurred while sending.";
				setError(errorMessage);
				options?.onError?.(errorMessage);
				return { success: false };
			} finally {
				setIsSending(false);
			}
		},
		[options],
	);

	return {
		send,
		isSending,
		error,
		clearError,
		reset,
	};
}
