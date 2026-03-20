"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useInvalidateRoomBookings } from "./use-room-bookings";

export interface UseDeleteBookingReturn {
	deleteBooking: (id: string) => Promise<{ success: boolean }>;
	isDeleting: boolean;
	error: string | null;
	clearError: () => void;
}

export function useDeleteBooking(
	onSuccess?: () => void,
): UseDeleteBookingReturn {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const invalidate = useInvalidateRoomBookings();

	const clearError = useCallback(() => setError(null), []);

	const deleteBooking = useCallback(
		async (id: string): Promise<{ success: boolean }> => {
			setIsDeleting(true);
			setError(null);

			try {
				const [err] = await api.roomBookings.delete({ id });

				if (err) {
					const msg = isDefinedError(err)
						? err.message
						: "Failed to delete booking";
					setError(msg);
					toast.error(msg);
					return { success: false };
				}

				toast.success("Booking deleted");
				await invalidate();
				onSuccess?.();
				return { success: true };
			} catch {
				const msg = "An unexpected error occurred";
				setError(msg);
				toast.error(msg);
				return { success: false };
			} finally {
				setIsDeleting(false);
			}
		},
		[invalidate, onSuccess],
	);

	return { deleteBooking, isDeleting, error, clearError };
}
