"use client";

import { CONFERENCE_ROOM_COLORS, type ConferenceRoom } from "@repo/shared";

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
	const roomColors = CONFERENCE_ROOM_COLORS[roomKey];

	const colorClass =
		status === "pending"
			? "bg-yellow-100 text-yellow-700"
			: status === "rejected"
				? "bg-red-100 text-red-700"
				: roomColors.label;

	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colorClass} ${className}`}
		>
			{status}
		</span>
	);
}
