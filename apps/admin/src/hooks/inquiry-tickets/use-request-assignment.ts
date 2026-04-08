"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseRequestAssignmentOptions {
	onSuccess?: () => void;
}

export interface UseRequestAssignmentReturn {
	requestAssignment: (ticketId: string) => Promise<{ success: boolean }>;
	isRequesting: boolean;
}

export function useRequestAssignment(
	options?: UseRequestAssignmentOptions,
): UseRequestAssignmentReturn {
	const [isRequesting, setIsRequesting] = useState(false);

	const requestAssignment = useCallback(
		async (ticketId: string): Promise<{ success: boolean }> => {
			if (!ticketId) return { success: false };

			setIsRequesting(true);

			try {
				const [err, result] = await api.inquiries.requestAssignment({
					id: ticketId,
				});

				if (err) {
					toast.error(
						isDefinedError(err) ? err.message : "Failed to request assignment",
					);
					return { success: false };
				}

				if (result) {
					toast.success("Assignment request sent");
					options?.onSuccess?.();
					return { success: true };
				}

				return { success: false };
			} catch (e) {
				const message =
					e instanceof Error
						? e.message
						: "An error occurred while requesting assignment";
				console.error(e);
				toast.error(message);
				return { success: false };
			} finally {
				setIsRequesting(false);
			}
		},
		[options],
	);

	return { requestAssignment, isRequesting };
}
