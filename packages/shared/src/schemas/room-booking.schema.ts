import { z } from "zod";
import {
	CONFERENCE_ROOM_VALUES,
	ROOM_BOOKING_STATUS_VALUES,
} from "../enums/room";

// ---------------------------------------------------------------------------
// Enum helpers
// ---------------------------------------------------------------------------

const RoomBookingStatusEnum = z.enum(
	ROOM_BOOKING_STATUS_VALUES as [string, ...string[]],
);

const ConferenceRoomEnum = z.enum(
	CONFERENCE_ROOM_VALUES as [string, ...string[]],
);

// Allowed MIME types for booking attachments (request letters)
const ALLOWED_ATTACHMENT_MIME_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/jpg",
] as const;

export const AttachmentMimeTypeEnum = z.enum(ALLOWED_ATTACHMENT_MIME_TYPES);
export type AttachmentMimeType = z.infer<typeof AttachmentMimeTypeEnum>;

// ---------------------------------------------------------------------------
// Entity / Response schemas
// ---------------------------------------------------------------------------

export const RoomBookingSchema = z.object({
	id: z.uuid(),
	bookedBy: z.uuid(),
	title: z.string(),
	startTime: z.date(),
	endTime: z.date(),
	requestedFor: z.string(),
	room: ConferenceRoomEnum,
	attachmentUrl: z.string().url().nullable(),
	status: RoomBookingStatusEnum,
	createdAt: z.date(),
});

/** Response shape returned to clients — datetimes are serialised as ISO strings. */
export const RoomBookingResponseSchema = z.object({
	id: z.uuid(),
	bookedBy: z.uuid(),
	title: z.string(),
	startTime: z.iso.datetime(),
	endTime: z.iso.datetime(),
	requestedFor: z.string(),
	room: ConferenceRoomEnum,
	attachmentUrl: z.string().nullable(),
	status: RoomBookingStatusEnum,
	createdAt: z.iso.datetime(),
	user: z
		.object({
			id: z.uuid(),
			fullName: z.string(),
		})
		.nullable(),
});

const PaginationResponseSchema = z.object({
	currentPage: z.number(),
	totalPages: z.number(),
	totalItems: z.number(),
	itemsPerPage: z.number(),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
});

export const RoomBookingListResponseSchema = z.object({
	bookings: RoomBookingResponseSchema.array(),
	pagination: PaginationResponseSchema,
});

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

export const GetRoomBookingListSchema = z.object({
	status: RoomBookingStatusEnum.optional(),
	room: ConferenceRoomEnum.optional(),
	/** Filter by date (ISO date string: YYYY-MM-DD). Returns bookings whose start_time falls on this day. */
	date: z.iso.date().optional(),
	/** Inclusive start of a date range (ISO date: YYYY-MM-DD). Use with `endDate` for multi-day queries. */
	startDate: z.iso.date().optional(),
	/** Exclusive end of a date range (ISO date: YYYY-MM-DD). Use with `startDate` for multi-day queries. */
	endDate: z.iso.date().optional(),
	/** Filter by the user who created the booking. */
	bookedBy: z.uuid().optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	page: z.coerce.number().int().min(1).default(1),
});

export const GetRoomBookingByIdSchema = z.object({
	id: z.uuid(),
});

export const CreateRoomBookingSchema = z.object({
	title: z.string().min(1).max(255),
	startTime: z.iso.datetime(),
	endTime: z.iso.datetime(),
	requestedFor: z.string().min(1).max(255),
	room: ConferenceRoomEnum,
	/** Storage path of a pre-uploaded attachment (optional). */
	attachmentUrl: z.string().optional(),
});

export const UpdateRoomBookingSchema = z.object({
	id: z.uuid(),
	title: z.string().min(1).max(255).optional(),
	startTime: z.iso.datetime().optional(),
	endTime: z.iso.datetime().optional(),
	requestedFor: z.string().min(1).max(255).optional(),
	room: ConferenceRoomEnum.optional(),
	attachmentUrl: z.string().nullable().optional(),
});

export const UpdateRoomBookingStatusSchema = z.object({
	id: z.uuid(),
	/** Can only transition a PENDING booking to CONFIRMED or REJECTED. */
	status: z.enum(["confirmed", "rejected"]),
});

// ---------------------------------------------------------------------------
// Upload URL schemas
// ---------------------------------------------------------------------------

export const GenerateBookingUploadUrlSchema = z.object({
	fileName: z.string().min(1).max(255),
	mimeType: AttachmentMimeTypeEnum,
	fileSize: z
		.number()
		.int()
		.positive()
		.max(5 * 1024 * 1024, "File size must not exceed 5MB"),
});

export const GenerateBookingUploadUrlResponseSchema = z.object({
	uploadUrl: z.string().url(),
	path: z.string(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type RoomBookingResponse = z.infer<typeof RoomBookingResponseSchema>;
export type RoomBookingListResponse = z.infer<
	typeof RoomBookingListResponseSchema
>;
export type GetRoomBookingListInput = z.infer<typeof GetRoomBookingListSchema>;
export type GetRoomBookingByIdInput = z.infer<typeof GetRoomBookingByIdSchema>;
export type CreateRoomBookingInput = z.infer<typeof CreateRoomBookingSchema>;
export type UpdateRoomBookingInput = z.infer<typeof UpdateRoomBookingSchema>;
export type UpdateRoomBookingStatusInput = z.infer<
	typeof UpdateRoomBookingStatusSchema
>;
export type GenerateBookingUploadUrlInput = z.infer<
	typeof GenerateBookingUploadUrlSchema
>;
export type GenerateBookingUploadUrlResponse = z.infer<
	typeof GenerateBookingUploadUrlResponseSchema
>;
