export const BOOKING_STATUS_BADGE_CLASSES = {
	pending: "bg-yellow-100 text-yellow-700 font-bold",
	confirmed: "bg-green-100 text-green-700 font-bold",
	rejected: "bg-red-100 text-red-700 font-bold",
	done: "bg-gray-100 text-gray-700 font-bold",
	expired: "bg-red-50 text-red-600 font-bold",
} as const;

export const BOOKING_CALENDAR_CHIP_CLASSES = {
	pending: "bg-[#f6bf26] text-white border border-transparent",
	done: "bg-gray-400 text-white border border-transparent",
	expired: "bg-red-400 text-white border border-transparent",
	default: "bg-gray-200",
} as const;

export const BOOKING_FORM_INPUT_BASE =
	"w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 shadow-sm transition-colors";

export const BOOKING_FORM_INPUT_FOCUS =
	"focus:outline-none focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20";

export const BOOKING_FORM_FIELD_ERROR = "border-red-500 ring-2 ring-red-500/20";

export const BOOKING_FORM_ERROR_BOX =
	"rounded-md border border-red-200 bg-red-50 px-4 py-3";

export const BOOKING_FORM_ERROR_TEXT = "text-sm text-red-700";

export const BOOKING_APPROVE_BUTTON_CLASS =
	"h-8 px-2.5 bg-green-600 hover:bg-green-700 text-white";

export const BOOKING_REJECT_BUTTON_CLASS =
	"h-8 px-2.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700";

export const BOOKING_PRIMARY_LINK_CLASS =
	"text-xs text-blue-700 hover:text-blue-800 w-full max-w-80";

export const BOOKING_TABLE_ROW_HOVER_CLASS =
	"hover:bg-gray-50/70 transition-colors";
