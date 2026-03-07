/**
 * UI-specific constants and helpers for Legislative Documents (Shared UI package)
 * These are presentation-layer utilities used for display and styling.
 *
 * Follows the same pattern as session-ui.ts
 */

/* ============================
   Document Type Badge Colors
   ============================ */

export const DOCUMENT_TYPE_BADGE_COLORS: Record<string, string> = {
	ordinance: "bg-blue-100 text-blue-800",
	resolution: "bg-green-100 text-green-800",
};

const DEFAULT_DOCUMENT_TYPE_BADGE_COLOR = "bg-gray-100 text-gray-800";

export function getDocumentTypeBadgeClass(type: string): string {
	return DOCUMENT_TYPE_BADGE_COLORS[type] || DEFAULT_DOCUMENT_TYPE_BADGE_COLOR;
}

/* ============================
   Brand Colors (Primary)
   ============================ */

/** Primary brand button: solid red background */
export const BRAND_BUTTON_CLASS = "bg-[#a60202] hover:bg-[#8a0101]";

/** Primary brand outline button: red border + text, fills on hover */
export const BRAND_OUTLINE_BUTTON_CLASS =
	"border-2 border-[#a60202] text-[#a60202] hover:bg-[#a60202] hover:text-white";

/** Link hover/focus color for brand consistency */
export const BRAND_LINK_HOVER_CLASS =
	"hover:text-[#a60202] focus-visible:text-[#a60202] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a60202]";

/** Document card left accent border */
export const DOCUMENT_CARD_BORDER_CLASS = "border-l-4 border-l-[#a60202]";

/** Brand-colored text (e.g. document numbers) */
export const BRAND_TEXT_CLASS = "text-[#a60202]";

/** Brand spinner color */
export const BRAND_SPINNER_CLASS = "text-[#a60202]";
