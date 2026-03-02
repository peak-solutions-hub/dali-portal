"use client";

import type { ConferenceRoom, RoomBookingStatus } from "@repo/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/api.client";

/**
 * Format a Date to a local "YYYY-MM-DD" string (no UTC shift).
 */
function toLocalDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

const STALE_TIME = 30_000; // 30 seconds

export function useRoomBookings(
	date: Date,
	room?: ConferenceRoom,
	status?: RoomBookingStatus,
) {
	const dateStr = toLocalDateString(date);

	return useQuery({
		...orpc.roomBookings.getList.queryOptions({
			input: {
				date: dateStr,
				limit: 100,
				...(room ? { room } : {}),
				...(status ? { status } : {}),
			},
		}),
		staleTime: STALE_TIME,
		refetchOnWindowFocus: false,
	});
}

export function usePendingRoomBookings(enabled = true) {
	return useQuery({
		...orpc.roomBookings.getList.queryOptions({
			input: {
				status: "pending",
				limit: 100,
			},
		}),
		enabled,
		staleTime: STALE_TIME,
		refetchOnWindowFocus: false,
	});
}

/**
 * Fetch all bookings for a given calendar month.
 * `month` is 0-indexed (0 = January).
 */
export function useMonthBookings(year: number, month: number) {
	const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
	// Build endDate as the 1st of the NEXT month (exclusive upper bound)
	const nextMonth = month === 11 ? 0 : month + 1;
	const nextYear = month === 11 ? year + 1 : year;
	const endDate = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;

	return useQuery({
		...orpc.roomBookings.getList.queryOptions({
			input: {
				startDate,
				endDate,
				limit: 100,
			},
		}),
		staleTime: STALE_TIME,
		refetchOnWindowFocus: false,
	});
}

/**
 * Fetch all bookings created by a specific user (all statuses).
 */
export function useMyBookings(userId: string | null) {
	return useQuery({
		...orpc.roomBookings.getList.queryOptions({
			input: {
				bookedBy: userId ?? "",
				limit: 100,
			},
		}),
		enabled: !!userId,
		staleTime: STALE_TIME,
		refetchOnWindowFocus: false,
	});
}

/** Returns `.key()` for the roomBookings getList — used by mutations to invalidate. */
export function useInvalidateRoomBookings() {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({
			queryKey: orpc.roomBookings.getList.key(),
		});
}

export { toLocalDateString };
