"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

export interface UseAssignTicketToOptions {
	/** Callback when assignment succeeds */
	onSuccess?: () => void;
}

export interface UseAssignTicketToReturn {
	/** Assign a ticket to a specific user (or null to unassign) */
	assignTo: (
		ticketId: string,
		assignedTo: string | null,
	) => Promise<{ success: boolean }>;
	/** Whether an assignment is in progress */
	isAssigning: boolean;
}

/**
 * Hook for assigning inquiry tickets to any active staff member.
 * Handles API calls, toast notifications, and loading state.
 */
export function useAssignTicketTo(
	options?: UseAssignTicketToOptions,
): UseAssignTicketToReturn {
	const [isAssigning, setIsAssigning] = useState(false);

	const assignTo = useCallback(
		async (
			ticketId: string,
			assignedTo: string | null,
		): Promise<{ success: boolean }> => {
			if (!ticketId) return { success: false };

			setIsAssigning(true);

			try {
				const [err, result] = await api.inquiries.assignTicket({
					id: ticketId,
					assignedTo,
				});

				if (err) {
					toast.error(
						isDefinedError(err) ? err.message : "Failed to assign ticket",
					);
					return { success: false };
				}

				if (result) {
					if (assignedTo === null) {
						toast.success(
							`Inquiry ${result.referenceNumber} has been unassigned`,
						);
					} else {
						toast.success(
							`Inquiry ${result.referenceNumber} assigned to ${result.user?.fullName ?? "staff member"}`,
						);
					}
					options?.onSuccess?.();
					return { success: true };
				}

				return { success: false };
			} catch (e) {
				const message =
					e instanceof Error
						? e.message
						: "An error occurred while assigning ticket";
				console.error(e);
				toast.error(message);
				return { success: false };
			} finally {
				setIsAssigning(false);
			}
		},
		[options],
	);

	return { assignTo, isAssigning };
}
