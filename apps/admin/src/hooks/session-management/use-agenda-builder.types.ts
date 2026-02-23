import {
	getSectionLabel,
	SESSION_SECTION_ORDER,
} from "@repo/ui/lib/session-ui";

/* ============================
   Agenda Builder UI Types
   ============================ */

export interface AttachedDocument {
	id: string;
	codeNumber: string;
	title: string;
	summary?: string;
	classification?: string;
	orderIndex?: number;
}

export interface CustomTextItem {
	id: string;
	content: string;
	classification?: string;
	orderIndex: number;
}

export interface BuildAgendaItem {
	section: string;
	orderIndex: number;
	contentText?: string | null;
	linkedDocument?: string | null;
	classification?: string | null;
	isCustomText?: boolean;
}

/* ============================
   Agenda Section Constants
   ============================ */

export const DEFAULT_AGENDA_ITEMS = SESSION_SECTION_ORDER.map(
	(section, index) => ({
		id: section,
		title: `${String.fromCharCode(65 + index)}. ${getSectionLabel(section)
			.replace(/\s+of:$/, "")
			.replace(/:$/, "")}`,
		section,
		orderIndex: index,
	}),
);

export type AgendaItem = (typeof DEFAULT_AGENDA_ITEMS)[number];
