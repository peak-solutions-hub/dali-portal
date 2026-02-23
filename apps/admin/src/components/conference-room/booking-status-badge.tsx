"use client";

import type { ConferenceRoom } from "@repo/shared";
import { CONFERENCE_ROOM_COLORS } from "@repo/shared";

interface BookingStatusBadgeProps {
	status: "pending" | "confirmed" | "rejected";
	roomKey: ConferenceRoom;
	/** Whether the booking's end time has already elapsed. */
	isPast?: boolean;
	/** Extra Tailwind classes. */
	className?: string;
}

export function BookingStatusBadge({
	status,
	className = "",
	isPast,
}: BookingStatusBadgeProps) {
	const isDone = isPast && status === "confirmed";
	const isExpired = isPast && status === "pending";

	const colorClass = isDone
		? "bg-gray-100 text-gray-700 font-bold"
		: isExpired
			? "bg-red-50 text-red-600 font-bold"
			: status === "pending"
				? "bg-yellow-100 text-yellow-700 font-bold"
				: status === "rejected"
					? "bg-red-100 text-red-700 font-bold"
					: "bg-green-100 text-green-700 font-bold";

	const displayStatus = isDone ? "done" : isExpired ? "expired" : status;

	return (
		<span
			className={`text-[10px] px-2 py-0.5 rounded-full capitalize w-max ${colorClass} ${className}`}
		>
			{displayStatus}
		</span>
	);
}
