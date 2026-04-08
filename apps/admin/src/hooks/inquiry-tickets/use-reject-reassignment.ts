"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseRejectReassignmentOptions {
	onSuccess?: () => void;
}

export interface UseRejectReassignmentReturn {
	rejectReassignment: (ticketId: string) => Promise<{ success: boolean }>;
	isRejecting: boolean;
}

export function useRejectReassignment(
	options?: UseRejectReassignmentOptions,
): UseRejectReassignmentReturn {
	const [isRejecting, setIsRejecting] = useState(false);

	const rejectReassignment = useCallback(
		async (ticketId: string): Promise<{ success: boolean }> => {
			if (!ticketId) return { success: false };

			setIsRejecting(true);

			try {
				const [err, result] = await api.inquiries.rejectReassignment({
					id: ticketId,
				});

				if (err) {
					toast.error(
						isDefinedError(err) ? err.message : "Failed to reject reassignment",
					);
					return { success: false };
				}

				if (result) {
					toast.success("Reassignment rejected");
					options?.onSuccess?.();
					return { success: true };
				}

				return { success: false };
			} catch (e) {
				const message =
					e instanceof Error
						? e.message
						: "An error occurred while rejecting reassignment";
				console.error(e);
				toast.error(message);
				return { success: false };
			} finally {
				setIsRejecting(false);
			}
		},
		[options],
	);

	return { rejectReassignment, isRejecting };
}
