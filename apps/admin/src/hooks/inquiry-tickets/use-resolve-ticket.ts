"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseResolveTicketOptions {
	/** Callback when ticket is resolved successfully */
	onSuccess?: (ticketId: string, referenceNumber?: string) => void;
	/** Callback when an error occurs */
	onError?: (error: string) => void;
}

export interface UseResolveTicketReturn {
	/** Resolve ticket with closure remarks */
	resolve: (ticketId: string, remarks: string) => Promise<{ success: boolean }>;
	/** Loading state */
	isResolving: boolean;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for resolving inquiry tickets
 * Handles API calls, error handling, and loading states
 */
export function useResolveTicket(
	options?: UseResolveTicketOptions,
): UseResolveTicketReturn {
	const [isResolving, setIsResolving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsResolving(false);
		setError(null);
	}, []);

	const resolve = useCallback(
		async (
			ticketId: string,
			remarks: string,
		): Promise<{ success: boolean }> => {
			if (!ticketId) {
				return { success: false };
			}

			setIsResolving(true);
			setError(null);

			try {
				const [err, result] = await api.inquiries.updateStatus({
					id: ticketId,
					status: "resolved",
					closureRemarks: remarks,
				});

				if (err) {
					const errorMessage = isDefinedError(err)
						? err.message
						: "Failed to resolve ticket";
					setError(errorMessage);
					options?.onError?.(errorMessage);
					toast.error(errorMessage);
					return { success: false };
				}

				if (result) {
					toast.success(`Inquiry ${result.referenceNumber} has been resolved`);
					options?.onSuccess?.(ticketId, result.referenceNumber);
					return { success: true };
				}

				setError("Unexpected response from server");
				return { success: false };
			} catch (e) {
				const errorMessage =
					e instanceof Error
						? e.message
						: "An error occurred while resolving ticket";
				console.error(e);
				setError(errorMessage);
				options?.onError?.(errorMessage);
				toast.error(errorMessage);
				return { success: false };
			} finally {
				setIsResolving(false);
			}
		},
		[options],
	);

	return {
		resolve,
		isResolving,
		error,
		clearError,
		reset,
	};
}
