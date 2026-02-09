"use client";

import type { CreateInquiryTicketInput } from "@repo/shared";
import { useCallback, useState } from "react";
import { api } from "@/lib/api.client";

export interface UseSendInquiryOptions {
	onSuccess?: (referenceNumber: string) => void;
	onError?: (error: string) => void;
}

export interface UseSendInquiryReturn {
	/** Submit the inquiry */
	submit: (
		data: Omit<CreateInquiryTicketInput, "attachmentPaths">,
		attachmentPaths?: string[],
	) => Promise<{ success: boolean; referenceNumber?: string }>;
	/** Loading state */
	isSubmitting: boolean;
	/** Manually set the submitting state (e.g. before async pre-processing) */
	setIsSubmitting: (value: boolean) => void;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for submitting inquiry tickets
 * Handles API calls, error handling, and loading states
 */
export function useSendInquiry(
	options?: UseSendInquiryOptions,
): UseSendInquiryReturn {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsSubmitting(false);
		setError(null);
	}, []);

	const submit = useCallback(
		async (
			data: Omit<CreateInquiryTicketInput, "attachmentPaths">,
			attachmentPaths?: string[],
		): Promise<{ success: boolean; referenceNumber?: string }> => {
			setIsSubmitting(true);
			setError(null);

			try {
				// Filter valid attachment paths
				const validPaths = attachmentPaths?.filter(
					(path) => path && path.trim().length > 0,
				);

				const [err, response] = await api.inquiries.create({
					...data,
					attachmentPaths:
						validPaths && validPaths.length > 0 ? validPaths : undefined,
				});

				if (err) {
					const errorMessage = err.message;
					setError(errorMessage);
					options?.onError?.(errorMessage);
					return { success: false };
				}

				if (response?.referenceNumber) {
					options?.onSuccess?.(response.referenceNumber);
					return { success: true, referenceNumber: response.referenceNumber };
				}

				setError("Unexpected response from server.");
				return { success: false };
			} catch (e) {
				const errorMessage =
					e instanceof Error
						? e.message
						: "An unexpected error occurred during submission.";
				setError(errorMessage);
				options?.onError?.(errorMessage);
				return { success: false };
			} finally {
				setIsSubmitting(false);
			}
		},
		[options],
	);

	return {
		submit,
		isSubmitting,
		setIsSubmitting,
		error,
		clearError,
		reset,
	};
}
