"use client";

import { isDefinedError } from "@orpc/client";
import type { InquiryTicketWithMessagesAndAttachmentsResponse } from "@repo/shared";
import { useCallback, useState } from "react";
import { api } from "@/lib/api.client";

export interface UseRefreshTicketOptions {
	onSuccess?: (ticket: InquiryTicketWithMessagesAndAttachmentsResponse) => void;
	onError?: (error: string) => void;
}

export interface UseRefreshTicketReturn {
	/** Refresh ticket data */
	refresh: (
		ticketId: string,
	) => Promise<InquiryTicketWithMessagesAndAttachmentsResponse | null>;
	/** Loading state */
	isRefreshing: boolean;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for refreshing inquiry ticket data
 * Handles API calls, error handling, and loading states
 */
export function useRefreshTicket(
	options?: UseRefreshTicketOptions,
): UseRefreshTicketReturn {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsRefreshing(false);
		setError(null);
	}, []);

	const refresh = useCallback(
		async (
			ticketId: string,
		): Promise<InquiryTicketWithMessagesAndAttachmentsResponse | null> => {
			if (!ticketId) return null;

			setIsRefreshing(true);
			setError(null);

			try {
				const [err, result] = await api.inquiries.getWithMessages({
					id: ticketId,
				});

				if (err) {
					const errorMessage = isDefinedError(err)
						? err.message
						: "Failed to refresh ticket";
					setError(errorMessage);
					options?.onError?.(errorMessage);
					return null;
				}

				if (result) {
					options?.onSuccess?.(result);
					return result;
				}

				return null;
			} catch (e) {
				const errorMessage =
					e instanceof Error ? e.message : "An unexpected error occurred";
				setError(errorMessage);
				options?.onError?.(errorMessage);
				return null;
			} finally {
				setIsRefreshing(false);
			}
		},
		[options],
	);

	return {
		refresh,
		isRefreshing,
		error,
		clearError,
		reset,
	};
}
