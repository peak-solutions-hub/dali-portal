import { z } from "zod";
import { TEXT_LIMITS } from "../constants";
import {
	INQUIRY_CATEGORY_VALUES,
	INQUIRY_STATUS_VALUES,
	SENDER_TYPE_VALUES,
} from "../enums";

// enums

const InquiryTicketStatusEnum = z.enum(INQUIRY_STATUS_VALUES);
const InquiryTicketCategoryEnum = z.enum(INQUIRY_CATEGORY_VALUES);
const InquiryMessageSenderTypeEnum = z.enum(SENDER_TYPE_VALUES);

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
	content: z.string().min(1).max(TEXT_LIMITS.LG),
	attachmentPaths: z.string().array().nullable(),
	senderType: InquiryMessageSenderTypeEnum,
	createdAt: z.date(),
});

export const InquiryMessageListSchema = InquiryMessageSchema.array();

export const InquiryTicketWithMessagesSchema = InquiryTicketSchema.extend({
	inquiryMessages: InquiryMessageSchema.array(),
});

// override date field to be iso strings for frontend use
export const InquiryTicketResponseSchema = InquiryTicketSchema.extend({
	createdAt: z.iso.datetime(),
});

export const InquiryMessageResponseSchema = InquiryMessageSchema.extend({
	createdAt: z.iso.datetime(),
});

export const InquiryTicketWithMessagesResponseSchema =
	InquiryTicketResponseSchema.extend({
		inquiryMessages: InquiryMessageResponseSchema.array(),
	});

export const InquiryTicketListResponseSchema =
	InquiryTicketResponseSchema.array();

export const GetInquiryTicketListSchema = z.object({
	status: InquiryTicketStatusEnum.optional(),
	category: InquiryTicketCategoryEnum.optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	cursor: z.uuid().optional(),
});

export const GetInquiryTicketByIdSchema = z.object({
	id: z.uuid(),
});

export const CreateInquiryTicketSchema = z.object({
	citizenEmail: z.email(),
	citizenName: z.string().min(1).max(TEXT_LIMITS.XS),
	subject: z.string().min(1).max(TEXT_LIMITS.SM),
	category: InquiryTicketCategoryEnum,
	message: z.string().min(1).max(TEXT_LIMITS.LG),
	// optional because attachments may not be included with the initial message
	attachmentPaths: z.array(z.string()).optional(),
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
	referenceNumber: z.string(),
	citizenEmail: z.email(),
});

export const TrackInquiryTicketResponseSchema = z
	.object({
		id: z.uuid(),
	})
	.nullable();

export const SendInquiryMessageSchema = z.object({
	ticketId: z.uuid(),
	senderName: z.string().min(1).max(TEXT_LIMITS.XS),
	content: z.string().min(1).max(TEXT_LIMITS.LG),
	attachmentPaths: z.string().array().optional(),
	senderType: InquiryMessageSenderTypeEnum,
});

// output types

export type InquiryTicket = z.infer<typeof InquiryTicketSchema>;
export type InquiryTicketList = z.infer<typeof InquiryTicketListSchema>;
export type InquiryMessage = z.infer<typeof InquiryMessageSchema>;
export type InquiryMessageList = z.infer<typeof InquiryMessageListSchema>;
export type InquiryTicketWithMessages = z.infer<
	typeof InquiryTicketWithMessagesSchema
>;

// for frontend use

export type InquiryTicketResponse = z.infer<typeof InquiryTicketResponseSchema>;
export type InquiryMessageResponse = z.infer<
	typeof InquiryMessageResponseSchema
>;
export type InquiryTicketWithMessagesResponse = z.infer<
	typeof InquiryTicketWithMessagesResponseSchema
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
