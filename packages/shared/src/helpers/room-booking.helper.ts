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
	"ovm_staff",
	"legislative_staff",
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

/** Parses an `HH:mm` time string into minutes from midnight. */
export function parseTimeToMinutes(time: string): number | null {
	if (!time || !time.includes(":")) return null;
	const [hoursRaw, minutesRaw] = time.split(":");
	const hours = Number(hoursRaw);
	const minutes = Number(minutesRaw);

	if (Number.isNaN(hours) || Number.isNaN(minutes)) {
		return null;
	}

	return hours * 60 + minutes;
}

/** Returns true when the given date + `HH:mm` time is already in the past. */
export function isPastDateTime(
	date: Date,
	time: string,
	referenceDate: Date = new Date(),
): boolean {
	const minutes = parseTimeToMinutes(time);

	if (minutes === null) {
		return false;
	}

	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	const dateTime = new Date(date);
	dateTime.setHours(hours, mins, 0, 0);

	return dateTime.getTime() < referenceDate.getTime();
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
