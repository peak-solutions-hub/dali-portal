import { z } from "zod";
import { TEXT_LIMITS } from "../constants";
import { INQUIRY_CATEGORY_VALUES, INQUIRY_STATUS_VALUES } from "../enums";

const InquiryTicketStatusEnum = z.enum(INQUIRY_STATUS_VALUES);
const InquiryTicketCategoryEnum = z.enum(INQUIRY_CATEGORY_VALUES);

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
	createdAt: z.coerce.date(),
});

export const InquiryTicketListSchema = InquiryTicketSchema.array();

export const GetInquiryTicketListSchema = z.object({
	// Optional filters
	status: InquiryTicketStatusEnum.optional(),
	category: InquiryTicketCategoryEnum.optional(),
	// Pagination
	limit: z.coerce.number().int().min(1).max(100).default(20),
	cursor: z.uuid().optional(),
});

export const GetInquiryTicketByIdSchema = InquiryTicketSchema.pick({
	id: true,
});

export const CreateInquiryTicketSchema = z.object({
	citizenEmail: z.email(),
	citizenName: z.string().min(1).max(TEXT_LIMITS.XS),
	subject: z.string().min(1).max(TEXT_LIMITS.SM),
	category: InquiryTicketCategoryEnum,
	message: z.string().min(1).max(TEXT_LIMITS.LG),
});

export const CreateInquiryTicketResponseSchema = z.object({
	referenceNumber: z.string(),
});

export const UpdateInquiryTicketStatusSchema = InquiryTicketSchema.pick({
	id: true,
	status: true,
}).extend({
	closureRemarks: z.string().max(TEXT_LIMITS.SM).optional(),
});

// types
export type InquiryTicket = z.infer<typeof InquiryTicketSchema>;
export type InquiryTicketList = z.infer<typeof InquiryTicketListSchema>;
export type CreateInquiryTicketInput = z.infer<
	typeof CreateInquiryTicketSchema
>;
export type CreateInquiryTicketResponse = z.infer<
	typeof CreateInquiryTicketResponseSchema
>;
export type GetInquiryTicketByIdInput = z.infer<
	typeof GetInquiryTicketByIdSchema
>;
export type GetInquiryTicketListInput = z.infer<
	typeof GetInquiryTicketListSchema
>;
export type UpdateInquiryTicketStatusInput = z.infer<
	typeof UpdateInquiryTicketStatusSchema
>;
