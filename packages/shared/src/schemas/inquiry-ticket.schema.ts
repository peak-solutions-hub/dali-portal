import { z } from "zod";
import { FILE_COUNT_LIMITS, TEXT_LIMITS } from "../constants";
import {
	INQUIRY_CATEGORY_VALUES,
	INQUIRY_STATUS_VALUES,
	SENDER_TYPE_VALUES,
} from "../enums";

// enums

const InquiryTicketStatusEnum = z.enum(INQUIRY_STATUS_VALUES);
const InquiryTicketCategoryEnum = z.enum(INQUIRY_CATEGORY_VALUES);
const InquiryMessageSenderTypeEnum = z.enum(SENDER_TYPE_VALUES);

/**
 * Attachment with pre-generated signed URL for viewing/downloading.
 * Signed URLs expire after a configured time (typically 1 hour).
 */
export const AttachmentWithUrlSchema = z.object({
	/** Storage path (e.g., "inquiries/replies/123-file.pdf") */
	path: z.string(),
	/** Pre-signed URL for viewing/downloading (expires after ~1 hour) */
	signedUrl: z.string().nullable(),
	/** Display-friendly file name */
	fileName: z.string(),
});

export const InquiryTicketSchema = z.object({
	id: z.uuid(),
	referenceNumber: z.string(),
	assignedTo: z.uuid().nullable(),
	citizenEmail: z.email(),
	citizenName: z.string().min(1).max(TEXT_LIMITS.XS),
	subject: z.string().min(1).max(TEXT_LIMITS.SM),
	category: InquiryTicketCategoryEnum,
	status: InquiryTicketStatusEnum,
	closureRemarks: z.string().max(TEXT_LIMITS.SM).nullable(),
	createdAt: z.date(),
});

export const InquiryTicketListSchema = InquiryTicketSchema.array();

export const InquiryMessageSchema = z.object({
	id: z.uuid(),
	ticketId: z.uuid(),
	senderName: z.string().min(1).max(TEXT_LIMITS.XS),
	/** Message content - can be empty for attachment-only messages */
	content: z.string().max(TEXT_LIMITS.LG),
	attachmentPaths: z.string().array().nullable(),
	senderType: InquiryMessageSenderTypeEnum,
	createdAt: z.date(),
});

/**
 * Inquiry message with pre-generated attachment URLs.
 * Used in responses where attachments need to be viewable.
 */
export const InquiryMessageWithAttachmentsSchema = InquiryMessageSchema.extend({
	/** Attachments with pre-signed URLs for viewing/downloading */
	attachments: AttachmentWithUrlSchema.array(),
});

export const InquiryMessageListSchema = InquiryMessageSchema.array();

export const InquiryTicketWithMessagesSchema = InquiryTicketSchema.extend({
	inquiryMessages: InquiryMessageSchema.array(),
});

/**
 * Inquiry ticket with messages including pre-generated attachment URLs.
 * This is the main schema for viewing inquiry details with downloadable attachments.
 */
export const InquiryTicketWithMessagesAndAttachmentsSchema =
	InquiryTicketSchema.extend({
		inquiryMessages: InquiryMessageWithAttachmentsSchema.array(),
	});

// override date field to be iso strings for frontend use
export const InquiryTicketResponseSchema = InquiryTicketSchema.extend({
	createdAt: z.iso.datetime(),
});

export const InquiryMessageResponseSchema = InquiryMessageSchema.extend({
	createdAt: z.iso.datetime(),
});

/**
 * Response schema for inquiry messages with attachments and ISO datetime.
 */
export const InquiryMessageWithAttachmentsResponseSchema =
	InquiryMessageWithAttachmentsSchema.extend({
		createdAt: z.iso.datetime(),
	});

/**
 * Response schema for inquiry ticket with messages (without attachment URLs).
 * Use this for admin list views where attachments don't need to be downloaded.
 */
export const InquiryTicketWithMessagesResponseSchema =
	InquiryTicketResponseSchema.extend({
		inquiryMessages: InquiryMessageResponseSchema.array(),
	});

/**
 * Response schema for inquiry ticket with messages and pre-signed attachment URLs.
 * Use this when the frontend needs to display downloadable attachments.
 */
export const InquiryTicketWithMessagesAndAttachmentsResponseSchema =
	InquiryTicketResponseSchema.extend({
		inquiryMessages: InquiryMessageWithAttachmentsResponseSchema.array(),
	});

export const PaginationResponseSchema = z.object({
	currentPage: z.number(),
	totalPages: z.number(),
	totalItems: z.number(),
	itemsPerPage: z.number(),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
});

export const InquiryTicketListResponseSchema = z.object({
	tickets: InquiryTicketResponseSchema.array(),
	pagination: PaginationResponseSchema,
});

export const GetInquiryTicketListSchema = z.object({
	status: InquiryTicketStatusEnum.optional(),
	category: InquiryTicketCategoryEnum.optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	page: z.coerce.number().int().min(1).default(1),
});

export const GetInquiryTicketByIdSchema = z.object({
	id: z.uuid(),
});

export const CreateInquiryTicketSchema = z.object({
	citizenEmail: z
		.email({ message: "Enter a valid email address." })
		.max(TEXT_LIMITS.SM, { message: "Email is too long." }),
	citizenName: z
		.string()
		.min(1, { message: "Name is required." })
		.max(TEXT_LIMITS.XS, {
			message: `Name must be ${TEXT_LIMITS.XS} characters or less.`,
		}),
	subject: z
		.string()
		.min(1, { message: "Subject is required." })
		.max(TEXT_LIMITS.SM, {
			message: `Subject must be ${TEXT_LIMITS.SM} characters or less.`,
		}),
	category: InquiryTicketCategoryEnum,
	message: z
		.string()
		.min(1, { message: "Message is required." })
		.max(TEXT_LIMITS.LG, {
			message: `Message must be ${TEXT_LIMITS.LG} characters or less.`,
		}),
	// optional because attachments may not be included with the initial message
	attachmentPaths: z
		.array(
			z
				.string()
				.min(1, { message: "Attachment path cannot be empty." })
				.max(500, { message: "Attachment path is too long." }),
		)
		.max(FILE_COUNT_LIMITS.SM, {
			message: `Maximum ${FILE_COUNT_LIMITS.SM} attachments allowed.`,
		})
		.optional(),
	// captcha token
	captchaToken: z.string().nullable(),
});

export const CreateInquiryTicketResponseSchema = z.object({
	referenceNumber: z.string(),
});

export const UpdateInquiryTicketStatusSchema = z.object({
	id: z.uuid(),
	status: InquiryTicketStatusEnum,
	closureRemarks: z.string().max(TEXT_LIMITS.SM).optional(),
});

export const TrackInquiryTicketSchema = z.object({
	referenceNumber: z
		.string()
		.min(1, { message: "Reference number is required." })
		.max(TEXT_LIMITS.SM, { message: "Reference number is invalid." })
		.trim()
		.toUpperCase(),
	citizenEmail: z
		.email({ message: "Enter the email used for this inquiry." })
		.max(TEXT_LIMITS.SM, { message: "Email is too long." }),
});

export const TrackInquiryTicketResponseSchema = z
	.object({
		id: z.uuid(),
	})
	.nullable();

export const SendInquiryMessageSchema = z
	.object({
		ticketId: z.uuid(),
		senderName: z
			.string()
			.min(1, { message: "Name is required." })
			.max(TEXT_LIMITS.XS, {
				message: `Name must be ${TEXT_LIMITS.XS} characters or less.`,
			}),
		/** Message content - can be empty if attachments are present */
		content: z
			.string()
			.max(TEXT_LIMITS.LG, {
				message: `Message must be ${TEXT_LIMITS.LG} characters or less.`,
			})
			.default(""),
		attachmentPaths: z
			.array(
				z
					.string()
					.min(1, { message: "Attachment path cannot be empty." })
					.max(500, { message: "Attachment path is too long." }),
			)
			.max(FILE_COUNT_LIMITS.SM, {
				message: `Maximum ${FILE_COUNT_LIMITS.SM} attachments allowed.`,
			})
			.optional(),
		senderType: InquiryMessageSenderTypeEnum,
	})
	.refine(
		(data) =>
			data.content.trim().length > 0 ||
			(data.attachmentPaths && data.attachmentPaths.length > 0),
		{
			message: "Please enter a message or attach a file.",
			path: ["content"],
		},
	);

// output types

export type AttachmentWithUrl = z.infer<typeof AttachmentWithUrlSchema>;
export type InquiryTicket = z.infer<typeof InquiryTicketSchema>;
export type InquiryTicketList = z.infer<typeof InquiryTicketListSchema>;
export type InquiryMessage = z.infer<typeof InquiryMessageSchema>;
export type InquiryMessageList = z.infer<typeof InquiryMessageListSchema>;
export type InquiryMessageWithAttachments = z.infer<
	typeof InquiryMessageWithAttachmentsSchema
>;
export type InquiryTicketWithMessages = z.infer<
	typeof InquiryTicketWithMessagesSchema
>;
export type InquiryTicketWithMessagesAndAttachments = z.infer<
	typeof InquiryTicketWithMessagesAndAttachmentsSchema
>;

// for frontend use (ISO datetime strings)

export type InquiryTicketResponse = z.infer<typeof InquiryTicketResponseSchema>;
export type InquiryMessageResponse = z.infer<
	typeof InquiryMessageResponseSchema
>;
export type InquiryMessageWithAttachmentsResponse = z.infer<
	typeof InquiryMessageWithAttachmentsResponseSchema
>;
export type InquiryTicketWithMessagesResponse = z.infer<
	typeof InquiryTicketWithMessagesResponseSchema
>;
export type InquiryTicketWithMessagesAndAttachmentsResponse = z.infer<
	typeof InquiryTicketWithMessagesAndAttachmentsResponseSchema
>;
export type InquiryTicketListResponse = z.infer<
	typeof InquiryTicketListResponseSchema
>;

// input types

export type GetInquiryTicketListInput = z.infer<
	typeof GetInquiryTicketListSchema
>;
export type GetInquiryTicketByIdInput = z.infer<
	typeof GetInquiryTicketByIdSchema
>;
export type CreateInquiryTicketInput = z.infer<
	typeof CreateInquiryTicketSchema
>;
export type CreateInquiryTicketResponse = z.infer<
	typeof CreateInquiryTicketResponseSchema
>;
export type UpdateInquiryTicketStatusInput = z.infer<
	typeof UpdateInquiryTicketStatusSchema
>;
export type TrackInquiryTicketInput = z.infer<typeof TrackInquiryTicketSchema>;
export type TrackInquiryTicketResponse = z.infer<
	typeof TrackInquiryTicketResponseSchema
>;
export type SendInquiryMessageInput = z.infer<typeof SendInquiryMessageSchema>;
