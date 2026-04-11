"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseConfirmAssignmentOptions {
	onSuccess?: () => void;
}

export interface UseConfirmAssignmentReturn {
	confirmAssignment: (ticketId: string) => Promise<{ success: boolean }>;
	isConfirming: boolean;
}

export function useConfirmAssignment(
	options?: UseConfirmAssignmentOptions,
): UseConfirmAssignmentReturn {
	const [isConfirming, setIsConfirming] = useState(false);

	const confirmAssignment = useCallback(
		async (ticketId: string): Promise<{ success: boolean }> => {
			if (!ticketId) return { success: false };

			setIsConfirming(true);

			try {
				const [err, result] = await api.inquiries.confirmAssignment({
					id: ticketId,
				});

				if (err) {
					toast.error(
						isDefinedError(err) ? err.message : "Failed to confirm assignment",
					);
					return { success: false };
				}

				if (result) {
					toast.success("Assignment confirmed");
					options?.onSuccess?.();
					return { success: true };
				}

				return { success: false };
			} catch (e) {
				const message =
					e instanceof Error
						? e.message
						: "An error occurred while confirming assignment";
				console.error(e);
				toast.error(message);
				return { success: false };
			} finally {
				setIsConfirming(false);
			}
		},
		[options],
	);

	return { confirmAssignment, isConfirming };
}
