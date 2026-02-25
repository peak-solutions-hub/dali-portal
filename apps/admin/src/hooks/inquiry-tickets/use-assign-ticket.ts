"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseAssignTicketOptions {
	/** Callback when ticket is assigned successfully */
	onSuccess?: (ticketId: string, referenceNumber?: string) => void;
	/** Callback when an error occurs */
	onError?: (error: string) => void;
}

export interface UseAssignTicketReturn {
	/** Assign ticket to current user */
	assignToMe: (ticketId: string) => Promise<{ success: boolean }>;
	/** Loading state */
	isAssigning: boolean;
	/** Error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for assigning inquiry tickets to the current user
 * Handles API calls, error handling, and loading states
 */
export function useAssignTicket(
	options?: UseAssignTicketOptions,
): UseAssignTicketReturn {
	const [isAssigning, setIsAssigning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		setIsAssigning(false);
		setError(null);
	}, []);

	const assignToMe = useCallback(
		async (ticketId: string): Promise<{ success: boolean }> => {
			if (!ticketId) {
				return { success: false };
			}

			setIsAssigning(true);
			setError(null);

			try {
				const [err, result] = await api.inquiries.assignToMe({
					id: ticketId,
				});

				if (err) {
					const errorMessage = isDefinedError(err)
						? err.message
						: "Failed to assign ticket";
					setError(errorMessage);
					options?.onError?.(errorMessage);
					toast.error(errorMessage);
					return { success: false };
				}

				if (result) {
					toast.success(
						`Inquiry ${result.referenceNumber} has been assigned to you`,
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
						: "An error occurred while assigning ticket";
				console.error(e);
				setError(errorMessage);
				options?.onError?.(errorMessage);
				toast.error(errorMessage);
				return { success: false };
			} finally {
				setIsAssigning(false);
			}
		},
		[options],
	);

	return {
		assignToMe,
		isAssigning,
		error,
		clearError,
		reset,
	};
}
