import { FILE_SIZE_LIMITS } from "../constants";
import type { RoleType } from "../enums/role";
import type { ConferenceRoom } from "../enums/room";

// ---------------------------------------------------------------------------
// Role constants — single source of truth for the whole monorepo
// ---------------------------------------------------------------------------

/**
 * Roles whose bookings are auto-confirmed on creation (direct path).
 * Only `councilor` takes the approval path (PENDING).
 */
export const DIRECT_PATH_ROLES: RoleType[] = [
	"vice_mayor",
	"head_admin",
	"admin_staff",
	"ovm_staff",
	"legislative_staff",
];

/**
 * Roles that may approve/reject PENDING bookings and bypass ownership checks.
 */
export const ADMIN_BOOKING_ROLES: RoleType[] = [
	"vice_mayor",
	"head_admin",
	"admin_staff",
];

/**
 * Roles permitted to call the `PATCH /admin/bookings/{id}/status` endpoint.
 * Same as ADMIN_BOOKING_ROLES — exposed as a separate constant for clarity.
 */
export const APPROVAL_ROLES: RoleType[] = [...ADMIN_BOOKING_ROLES];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the initial booking status based on the user's role.
 * - Councilors start with `pending` (requires admin approval).
 * - All other conference-room roles are auto-confirmed.
 */
export function getInitialBookingStatus(
	role: RoleType,
): "pending" | "confirmed" {
	return role === "councilor" ? "pending" : "confirmed";
}

/**
 * Returns `true` when the role can approve/reject bookings and bypass
 * ownership checks (edit/delete any booking).
 */
export function isAdminBookingRole(role: RoleType): boolean {
	return (ADMIN_BOOKING_ROLES as string[]).includes(role);
}

// ---------------------------------------------------------------------------
// Booking rules
// ---------------------------------------------------------------------------

/** Minimum booking duration in minutes. */
export const MIN_DURATION_MINUTES = 15;

/** Supabase Storage bucket for booking attachments. */
export const BOOKING_ATTACHMENTS_BUCKET = "attachments";

/** Folder within the bucket where room-booking attachments are stored. */
export const BOOKING_UPLOAD_FOLDER = "room_bookings";

/** Maximum allowed attachment file size in bytes (5 MB). */
export const MAX_ATTACHMENT_SIZE_BYTES = FILE_SIZE_LIMITS.XS;

/** Allowed MIME types and their expected file extensions. */
export const MIME_EXTENSIONS: Record<string, string[]> = {
	"application/pdf": [".pdf"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/jpg": [".jpg", ".jpeg"],
};

// ---------------------------------------------------------------------------
// Display labels & colors
// ---------------------------------------------------------------------------

/** Human-readable room names keyed by the ConferenceRoom enum value. */
export const CONFERENCE_ROOM_LABELS: Record<ConferenceRoom, string> = {
	room_a: "4th Floor Conference Room",
	room_b: "7th Floor Conference Room",
};

/** Ordered list of conference rooms for <Select> dropdowns. */
export const CONFERENCE_ROOM_OPTIONS: {
	value: ConferenceRoom;
	label: string;
}[] = [
	{ value: "room_a", label: CONFERENCE_ROOM_LABELS.room_a },
	{ value: "room_b", label: CONFERENCE_ROOM_LABELS.room_b },
];

/**
 * Tailwind class sets for each conference room.
 * Used to apply consistent colors across calendar views.
 */
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
