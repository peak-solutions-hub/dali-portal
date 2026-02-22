"use client";

import type { ConferenceRoom } from "@repo/shared";
import { CONFERENCE_ROOM_COLORS } from "@/utils/booking-color-utils";

interface BookingStatusBadgeProps {
	status: "pending" | "confirmed" | "rejected";
	roomKey: ConferenceRoom;
	/** Extra Tailwind classes. */
	className?: string;
}

export function BookingStatusBadge({
	status,
	roomKey,
	className = "",
}: BookingStatusBadgeProps) {
	const colorClass =
		status === "pending"
			? "bg-yellow-100 text-yellow-700"
			: status === "rejected"
				? "bg-red-100 text-red-700"
				: "bg-green-100 text-green-700";

	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colorClass} ${className}`}
		>
			{status}
		</span>
	);
}
