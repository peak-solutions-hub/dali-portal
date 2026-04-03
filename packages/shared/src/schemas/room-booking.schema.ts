import { z } from "zod";
import { FILE_COUNT_LIMITS, FILE_SIZE_LIMITS } from "../constants";
import {
	CONFERENCE_ROOM_VALUES,
	MEETING_TYPE_VALUES,
	ROOM_BOOKING_STATUS_VALUES,
} from "../enums/room-booking";

// ---------------------------------------------------------------------------
// Enum helpers
// ---------------------------------------------------------------------------

const RoomBookingStatusEnum = z.enum(
	ROOM_BOOKING_STATUS_VALUES as [string, ...string[]],
);

const ConferenceRoomEnum = z.enum(
	CONFERENCE_ROOM_VALUES as [string, ...string[]],
);

const MeetingTypeEnum = z.enum(MEETING_TYPE_VALUES as [string, ...string[]]);
const DateTimeWithOffsetSchema = z.string().datetime({ offset: true });

// Allowed MIME types for booking attachments (request letters)
const ALLOWED_ATTACHMENT_MIME_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/jpg",
	"image/png",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
	meetingType: MeetingTypeEnum,
	meetingTypeOthers: z.string().nullable(),
	startTime: z.date(),
	endTime: z.date(),
	requestedFor: z.string(),
	room: ConferenceRoomEnum,
	attachmentPaths: z.string().array(),
	status: RoomBookingStatusEnum,
	createdAt: z.date(),
});

export const RoomBookingAttachmentResponseSchema = z.object({
	path: z.string(),
	url: z.string().nullable(),
});

/** Response shape returned to clients — datetimes are serialised as ISO strings. */
export const RoomBookingResponseSchema = z.object({
	id: z.uuid(),
	bookedBy: z.uuid(),
	title: z.string(),
	meetingType: MeetingTypeEnum,
	meetingTypeOthers: z.string().nullable(),
	startTime: z.iso.datetime(),
	endTime: z.iso.datetime(),
	requestedFor: z.string(),
	room: ConferenceRoomEnum,
	attachments: RoomBookingAttachmentResponseSchema.array(),
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

export const CreateRoomBookingSchema = z
	.object({
		title: z.string().min(1).max(255),
		meetingType: MeetingTypeEnum,
		meetingTypeOthers: z.string().min(1).max(255).optional(),
		startTime: DateTimeWithOffsetSchema,
		endTime: DateTimeWithOffsetSchema,
		requestedFor: z.string().min(1).max(255),
		room: ConferenceRoomEnum,
		/** Storage paths of pre-uploaded attachments (optional). */
		attachmentPaths: z
			.array(z.string().min(1))
			.max(FILE_COUNT_LIMITS.SM)
			.optional(),
	})
	.superRefine((value, context) => {
		if (value.meetingType === "others" && !value.meetingTypeOthers?.trim()) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["meetingTypeOthers"],
				message: "Please specify the meeting type when selecting others.",
			});
		}

		if (value.meetingType !== "others" && value.meetingTypeOthers) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["meetingTypeOthers"],
				message:
					"meetingTypeOthers is only allowed when meetingType is others.",
			});
		}
	});

export const UpdateRoomBookingSchema = z
	.object({
		id: z.uuid(),
		title: z.string().min(1).max(255).optional(),
		meetingType: MeetingTypeEnum.optional(),
		meetingTypeOthers: z.string().min(1).max(255).nullable().optional(),
		startTime: DateTimeWithOffsetSchema.optional(),
		endTime: DateTimeWithOffsetSchema.optional(),
		requestedFor: z.string().min(1).max(255).optional(),
		room: ConferenceRoomEnum.optional(),
		attachmentPaths: z
			.array(z.string().min(1))
			.max(FILE_COUNT_LIMITS.SM)
			.optional(),
	})
	.superRefine((value, context) => {
		if (value.meetingType === "others" && !value.meetingTypeOthers?.trim()) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["meetingTypeOthers"],
				message: "Please specify the meeting type when selecting others.",
			});
		}

		if (
			value.meetingType !== undefined &&
			value.meetingType !== "others" &&
			value.meetingTypeOthers !== undefined &&
			value.meetingTypeOthers !== null
		) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["meetingTypeOthers"],
				message:
					"meetingTypeOthers is only allowed when meetingType is others.",
			});
		}
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
		.max(FILE_SIZE_LIMITS.XS, "File size must not exceed 5MB"),
});

export const GenerateBookingUploadUrlResponseSchema = z.object({
	uploadUrl: z.string().url(),
	path: z.string(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type RoomBookingResponse = z.infer<typeof RoomBookingResponseSchema>;
export type RoomBookingAttachmentResponse = z.infer<
	typeof RoomBookingAttachmentResponseSchema
>;
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
