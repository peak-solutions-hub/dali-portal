import { z } from "zod";
import { TEXT_LIMITS } from "../constants";
import {
	CALLER_SLIP_STATUS_VALUES,
	DECISION_TYPE_VALUES,
	SOURCE_TYPE_VALUES,
} from "../enums";

// Enums
export const CallerSlipStatusEnum = z.enum(
	CALLER_SLIP_STATUS_VALUES as [string, ...string[]],
);
export const DecisionTypeEnum = z.enum(
	DECISION_TYPE_VALUES as [string, ...string[]],
);

/**
 * Invitation detail within a caller slip (includes document info)
 */
export const CallerSlipInvitationSchema = z.object({
	id: z.uuid(),
	documentId: z.uuid(),
	document: z.object({
		codeNumber: z.string(),
		title: z.string(),
		receivedAt: z.iso.datetime(),
		source: z.enum(SOURCE_TYPE_VALUES as [string, ...string[]]),
	}),
	eventVenue: z.string(),
	eventStartTime: z.iso.datetime(),
	eventEndTime: z.iso.datetime(),
	vmDecision: DecisionTypeEnum.nullable(),
	vmDecisionRemarks: z.string().nullable(),
	representativeName: z.string().nullable(),
});

/**
 * Caller slip list item
 */
export const CallerSlipListItemSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	status: CallerSlipStatusEnum,
	createdAt: z.iso.datetime(),
	invitationCount: z.number().int().min(0),
	generatedBy: z.object({
		id: z.uuid(),
		fullName: z.string(),
	}),
});

export const CallerSlipListPaginationSchema = z.object({
	total: z.number().int().min(0),
	page: z.number().int().min(1),
	limit: z.number().int().min(1),
	totalPages: z.number().int().min(0),
});

export const CallerSlipListResponseSchema = z.object({
	items: CallerSlipListItemSchema.array(),
	pagination: CallerSlipListPaginationSchema,
});

/**
 * Caller slip detail (single slip with all invitations)
 */
export const CallerSlipDetailSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	status: CallerSlipStatusEnum,
	createdAt: z.iso.datetime(),
	generatedBy: z.object({
		id: z.uuid(),
		fullName: z.string(),
	}),
	invitations: CallerSlipInvitationSchema.array(),
});

/**
 * Input: Get caller slip list
 */
export const GetCallerSlipListSchema = z.object({
	status: CallerSlipStatusEnum.optional(),
	search: z.string().trim().max(TEXT_LIMITS.SM).optional(),
	dateFrom: z.string().date().optional(),
	dateTo: z.string().date().optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Input: Get caller slip by ID
 */
export const GetCallerSlipByIdSchema = z.object({
	id: z.uuid(),
});

/**
 * Input: Generate (create) a caller slip
 */
export const GenerateCallerSlipSchema = z.object({
	name: z.string().trim().min(1).max(TEXT_LIMITS.SM),
	invitationDocumentIds: z.uuid().array().min(1),
});

export const GenerateCallerSlipResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	status: CallerSlipStatusEnum,
});

/**
 * Input: Record a decision on an invitation within a caller slip
 */
export const RecordDecisionSchema = z
	.object({
		slipId: z.uuid(),
		invitationId: z.uuid(),
		vmDecision: DecisionTypeEnum,
		vmDecisionRemarks: z
			.string()
			.trim()
			.max(TEXT_LIMITS.MD)
			.nullable()
			.optional(),
		representativeName: z
			.string()
			.trim()
			.min(1)
			.max(TEXT_LIMITS.SM)
			.nullable()
			.optional(),
	})
	.superRefine((input, ctx) => {
		if (
			input.vmDecision === "assign_representative" &&
			!input.representativeName
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["representativeName"],
				message:
					"Representative name is required when assigning a representative",
			});
		}
	});

export const RecordDecisionResponseSchema = CallerSlipInvitationSchema;

/**
 * Input: Complete a caller slip
 */
export const CompleteCallerSlipSchema = z.object({
	id: z.uuid(),
});

export const CompleteCallerSlipResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	status: CallerSlipStatusEnum,
});

// Types
export type CallerSlipInvitation = z.infer<typeof CallerSlipInvitationSchema>;
export type CallerSlipListItem = z.infer<typeof CallerSlipListItemSchema>;
export type CallerSlipListPagination = z.infer<
	typeof CallerSlipListPaginationSchema
>;
export type CallerSlipListResponse = z.infer<
	typeof CallerSlipListResponseSchema
>;
export type CallerSlipDetail = z.infer<typeof CallerSlipDetailSchema>;
export type GetCallerSlipListInput = z.infer<typeof GetCallerSlipListSchema>;
export type GetCallerSlipByIdInput = z.infer<typeof GetCallerSlipByIdSchema>;
export type GenerateCallerSlipInput = z.infer<typeof GenerateCallerSlipSchema>;
export type GenerateCallerSlipResponse = z.infer<
	typeof GenerateCallerSlipResponseSchema
>;
export type RecordDecisionInput = z.infer<typeof RecordDecisionSchema>;
export type RecordDecisionResponse = z.infer<
	typeof RecordDecisionResponseSchema
>;
export type CompleteCallerSlipInput = z.infer<typeof CompleteCallerSlipSchema>;
export type CompleteCallerSlipResponse = z.infer<
	typeof CompleteCallerSlipResponseSchema
>;
