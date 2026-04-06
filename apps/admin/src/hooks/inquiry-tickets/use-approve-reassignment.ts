"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseApproveReassignmentOptions {
	onSuccess?: () => void;
}

export interface UseApproveReassignmentReturn {
	approveReassignment: (ticketId: string) => Promise<{ success: boolean }>;
	isApproving: boolean;
}

export function useApproveReassignment(
	options?: UseApproveReassignmentOptions,
): UseApproveReassignmentReturn {
	const [isApproving, setIsApproving] = useState(false);

	const approveReassignment = useCallback(
		async (ticketId: string): Promise<{ success: boolean }> => {
			if (!ticketId) return { success: false };

			setIsApproving(true);

			try {
				const [err, result] = await api.inquiries.approveReassignment({
					id: ticketId,
				});

				if (err) {
					toast.error(
						isDefinedError(err)
							? err.message
							: "Failed to approve reassignment",
					);
					return { success: false };
				}

				if (result) {
					toast.success("Reassignment approved");
					options?.onSuccess?.();
					return { success: true };
				}

				return { success: false };
			} catch (e) {
				const message =
					e instanceof Error
						? e.message
						: "An error occurred while approving reassignment";
				console.error(e);
				toast.error(message);
				return { success: false };
			} finally {
				setIsApproving(false);
			}
		},
		[options],
	);

	return { approveReassignment, isApproving };
}
