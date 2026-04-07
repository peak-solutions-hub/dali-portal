"use client";

import type { ConferenceRoom } from "@repo/shared";
import { BOOKING_STATUS_BADGE_CLASSES } from "@repo/ui/lib/conference-room-ui";

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
	const displayStatus = isDone ? "done" : isExpired ? "expired" : status;

	const colorClass = BOOKING_STATUS_BADGE_CLASSES[displayStatus];
	const displayLabel = displayStatus === "done" ? "completed" : displayStatus;

	return (
		<span
			className={`text-[10px] px-2 py-0.5 rounded-full capitalize w-max ${colorClass} ${className}`}
		>
			{displayLabel}
		</span>
	);
}
