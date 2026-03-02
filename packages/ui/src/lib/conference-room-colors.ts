import type { ConferenceRoom } from "@repo/shared";

export type ConferenceRoomColorConfig = {
	bg: string;
	border: string;
	text: string;
	label: string;
	dot: string;
	chip: string;
};

export const CONFERENCE_ROOM_COLORS: Record<
	ConferenceRoom,
	ConferenceRoomColorConfig
> = {
	room_a: {
		bg: "bg-[#039be5]",
		border: "border-l-[#0288d1]",
		text: "text-white",
		label: "bg-[#039be5] text-white",
		dot: "bg-[#039be5]",
		chip: "bg-[#039be5] text-white border border-transparent",
	},
	room_b: {
		bg: "bg-[#0b8043]",
		border: "border-l-[#096a36]",
		text: "text-white",
		label: "bg-[#0b8043] text-white",
		dot: "bg-[#0b8043]",
		chip: "bg-[#0b8043] text-white border border-transparent",
	},
};
