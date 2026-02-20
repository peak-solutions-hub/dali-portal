"use client";

import { isDefinedError } from "@orpc/client";
import type { InquiryStatus } from "@repo/shared";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

type ConclusionAction = "resolved" | "rejected";

export interface UseConcludeTicketOptions {
	/** Callback when ticket is concluded successfully */
	onSuccess?: (ticketId: string, referenceNumber?: string) => void;
	/** Callback when an error occurs */
	onError?: (error: string) => void;
}

export interface UseConcludeTicketReturn {
	/** Conclude ticket with closure remarks */
	conclude: (
		ticketId: string,
		action: ConclusionAction,
		remarks: string,
	) => Promise<{ success: boolean }>;
	/** Loading state */
	isConcluding: boolean;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for concluding inquiry tickets (resolving or rejecting)
 * Handles API calls, error handling, and loading states
 */
export function useConcludeTicket(
	options?: UseConcludeTicketOptions,
): UseConcludeTicketReturn {
	const [isConcluding, setIsConcluding] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsConcluding(false);
		setError(null);
	}, []);

	const conclude = useCallback(
		async (
			ticketId: string,
			action: ConclusionAction,
			remarks: string,
		): Promise<{ success: boolean }> => {
			if (!ticketId) {
				return { success: false };
			}

			setIsConcluding(true);
			setError(null);

			const actionLabel = action === "resolved" ? "resolve" : "reject";
			const actionPastTense = action === "resolved" ? "resolved" : "rejected";

			try {
				const [err, result] = await api.inquiries.updateStatus({
					id: ticketId,
					status: action as InquiryStatus,
					closureRemarks: remarks,
				});

				if (err) {
					const errorMessage = isDefinedError(err)
						? err.message
						: `Failed to ${actionLabel} ticket`;
					setError(errorMessage);
					options?.onError?.(errorMessage);
					toast.error(errorMessage);
					return { success: false };
				}

				if (result) {
					toast.success(
						`Inquiry ${result.referenceNumber} has been ${actionPastTense}`,
					);
					options?.onSuccess?.(ticketId, result.referenceNumber);
					return { success: true };
				}

				setError("Unexpected response from server");
				return { success: false };
			} catch (e) {
				const errorMessage =
					e instanceof Error
						? e.message
						: `An error occurred while ${actionLabel}ing ticket`;
				console.error(e);
				setError(errorMessage);
				options?.onError?.(errorMessage);
				toast.error(errorMessage);
				return { success: false };
			} finally {
				setIsConcluding(false);
			}
		},
		[options],
	);

	return {
		conclude,
		isConcluding,
		error,
		clearError,
		reset,
	};
}
