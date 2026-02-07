"use client";

import { isDefinedError } from "@orpc/client";
import type { TrackInquiryTicketInput } from "@repo/shared";
import { useCallback, useState } from "react";
import { api } from "@/lib/api.client";

export interface UseTrackInquiryOptions {
	onSuccess?: (ticketId: string) => void;
	onError?: (error: string) => void;
}

export interface UseTrackInquiryReturn {
	/** Track the inquiry */
	track: (
		data: TrackInquiryTicketInput,
	) => Promise<{ success: boolean; ticketId?: string }>;
	/** Loading state */
	isTracking: boolean;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for tracking inquiry tickets by reference number and email
 * Handles API calls, error handling, and loading states
 */
export function useTrackInquiry(
	options?: UseTrackInquiryOptions,
): UseTrackInquiryReturn {
	const [isTracking, setIsTracking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsTracking(false);
		setError(null);
	}, []);

	const track = useCallback(
		async (
			data: TrackInquiryTicketInput,
		): Promise<{ success: boolean; ticketId?: string }> => {
			setIsTracking(true);
			setError(null);

			try {
				const [err, response] = await api.inquiries.track(data);

				if (err) {
					const errorMessage = isDefinedError(err)
						? err.message
						: "Failed to track inquiry. Please try again.";
					setError(errorMessage);
					options?.onError?.(errorMessage);
					return { success: false };
				}

				if (!response?.id) {
					const notFoundMessage =
						"Inquiry not found. Please check your reference number and email.";
					setError(notFoundMessage);
					options?.onError?.(notFoundMessage);
					return { success: false };
				}

				options?.onSuccess?.(response.id);
				return { success: true, ticketId: response.id };
			} catch (e) {
				const errorMessage =
					e instanceof Error
						? e.message
						: "An unexpected error occurred while tracking.";
				setError(errorMessage);
				options?.onError?.(errorMessage);
				return { success: false };
			} finally {
				setIsTracking(false);
			}
		},
		[options],
	);

	return {
		track,
		isTracking,
		error,
		clearError,
		reset,
	};
}
