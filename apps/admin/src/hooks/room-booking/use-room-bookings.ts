"use client";

import type { ConferenceRoom } from "@repo/shared";
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

export function useRoomBookings(date: Date, room?: ConferenceRoom) {
	const dateStr = toLocalDateString(date);

	return useQuery(
		orpc.roomBookings.getList.queryOptions({
			input: {
				date: dateStr,
				limit: 100,
				...(room ? { room } : {}),
			},
		}),
	);
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
