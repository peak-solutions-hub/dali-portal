import type { ConferenceRoom } from "@repo/shared";

export const CONFERENCE_ROOM_COLORS: Record<
	ConferenceRoom,
	{
		bg: string;
		border: string;
		text: string;
		label: string;
		dot: string;
		chip: string;
	}
> = {
	room_a: {
		bg: "bg-blue-50",
		border: "border-l-blue-500",
		text: "text-blue-700",
		label: "bg-blue-100 text-blue-700",
		dot: "bg-blue-500",
		chip: "bg-blue-600 text-white",
	},
	room_b: {
		bg: "bg-purple-100",
		border: "border-l-purple-500",
		text: "text-purple-700",
		label: "bg-purple-100 text-purple-700",
		dot: "bg-purple-500",
		chip: "bg-purple-600 text-white",
	},
};
