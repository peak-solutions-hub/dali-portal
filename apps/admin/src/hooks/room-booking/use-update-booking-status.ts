"use client";

import { isDefinedError } from "@orpc/client";
import type { RoomBookingStatus } from "@repo/shared";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useInvalidateRoomBookings } from "./use-room-bookings";

export interface UseUpdateBookingStatusReturn {
	updateStatus: (
		id: string,
		status: Extract<RoomBookingStatus, "confirmed" | "rejected">,
	) => Promise<{ success: boolean }>;
	isUpdating: boolean;
	error: string | null;
	clearError: () => void;
}

export function useUpdateBookingStatus(
	onSuccess?: () => void,
): UseUpdateBookingStatusReturn {
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const invalidate = useInvalidateRoomBookings();

	const clearError = useCallback(() => setError(null), []);

	const updateStatus = useCallback(
		async (
			id: string,
			status: Extract<RoomBookingStatus, "confirmed" | "rejected">,
		): Promise<{ success: boolean }> => {
			setIsUpdating(true);
			setError(null);

			try {
				const [err] = await api.roomBookings.updateStatus({ id, status });

				if (err) {
					const msg = isDefinedError(err)
						? err.message
						: "Failed to update booking status";
					setError(msg);
					toast.error(msg);
					return { success: false };
				}

				const label =
					status === "confirmed" ? "Booking approved" : "Booking rejected";
				toast.success(label);
				await invalidate();
				onSuccess?.();
				return { success: true };
			} catch {
				const msg = "An unexpected error occurred";
				setError(msg);
				toast.error(msg);
				return { success: false };
			} finally {
				setIsUpdating(false);
			}
		},
		[invalidate, onSuccess],
	);

	return { updateStatus, isUpdating, error, clearError };
}
