"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseRejectTicketOptions {
	/** Callback when ticket is rejected successfully */
	onSuccess?: (ticketId: string, referenceNumber?: string) => void;
	/** Callback when an error occurs */
	onError?: (error: string) => void;
}

export interface UseRejectTicketReturn {
	/** Reject ticket with closure remarks */
	reject: (ticketId: string, remarks: string) => Promise<{ success: boolean }>;
	/** Loading state */
	isRejecting: boolean;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for rejecting inquiry tickets
 * Handles API calls, error handling, and loading states
 */
export function useRejectTicket(
	options?: UseRejectTicketOptions,
): UseRejectTicketReturn {
	const [isRejecting, setIsRejecting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsRejecting(false);
		setError(null);
	}, []);

	const reject = useCallback(
		async (
			ticketId: string,
			remarks: string,
		): Promise<{ success: boolean }> => {
			if (!ticketId) {
				return { success: false };
			}

			setIsRejecting(true);
			setError(null);

			try {
				const [err, result] = await api.inquiries.updateStatus({
					id: ticketId,
					status: "rejected",
					closureRemarks: remarks,
				});

				if (err) {
					const errorMessage = isDefinedError(err)
						? err.message
						: "Failed to reject ticket";
					setError(errorMessage);
					options?.onError?.(errorMessage);
					toast.error(errorMessage);
					return { success: false };
				}

				if (result) {
					toast.success(`Inquiry ${result.referenceNumber} has been rejected`);
					options?.onSuccess?.(ticketId, result.referenceNumber);
					return { success: true };
				}

				setError("Unexpected response from server");
				return { success: false };
			} catch (e) {
				const errorMessage =
					e instanceof Error
						? e.message
						: "An error occurred while rejecting ticket";
				console.error(e);
				setError(errorMessage);
				options?.onError?.(errorMessage);
				toast.error(errorMessage);
				return { success: false };
			} finally {
				setIsRejecting(false);
			}
		},
		[options],
	);

	return {
		reject,
		isRejecting,
		error,
		clearError,
		reset,
	};
}
