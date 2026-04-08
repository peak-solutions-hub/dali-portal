import { z } from "zod";
import { FILE_SIZE_LIMITS, isPurposeAllowed, TEXT_LIMITS } from "../constants";
import {
	CLASSIFICATION_TYPE_VALUES,
	DOCUMENT_TYPE_VALUES,
	type DocumentType,
	PURPOSE_TYPE_VALUES,
	type PurposeType,
	SOURCE_TYPE_VALUES,
	STATUS_TYPE_VALUES,
} from "../enums/document";
import { DocumentAuditResponseSchema } from "./document-audit.schema";
import { DocumentVersionWithSignedUrlSchema } from "./document-version.schema";

// Document enum types
export const DocumentTypeEnum = z.enum(
	DOCUMENT_TYPE_VALUES as [string, ...string[]],
);
export const PurposeTypeEnum = z.enum(
	PURPOSE_TYPE_VALUES as [string, ...string[]],
);
export const SourceTypeEnum = z.enum(
	SOURCE_TYPE_VALUES as [string, ...string[]],
);
export const StatusTypeEnum = z.enum(
	STATUS_TYPE_VALUES as [string, ...string[]],
);
export const ClassificationTypeEnum = z.enum(
	CLASSIFICATION_TYPE_VALUES as [string, ...string[]],
);

// Legislative document specific type (subset of DocumentType)
export const LegislativeDocumentTypeEnum = z.enum(["ordinance", "resolution"]);
export const DocumentListTabEnum = z.enum([
	"all",
	"legislative",
	"administrative",
	"invitations",
]);
export const SortOrderEnum = z.enum(["asc", "desc"]);
export const DocumentSortByEnum = z.enum([
	"receivedAt",
	"codeNumber",
	"title",
	"source",
	"type",
	"status",
]);

/**
 * Base Document schema (from document table)
 */
export const DocumentSchema = z.object({
	id: z.string(),
	codeNumber: z.string(),
	title: z.string().min(1).max(TEXT_LIMITS.SM),
	type: DocumentTypeEnum,
	purpose: PurposeTypeEnum,
	source: SourceTypeEnum,
	status: StatusTypeEnum,
	classification: ClassificationTypeEnum.nullable(),
	remarks: z.string().max(TEXT_LIMITS.MD).nullable(),
	receivedAt: z.coerce.date(),
});

export const DocumentResponseSchema = DocumentSchema.extend({
	receivedAt: z.iso.datetime(),
});

export const DocumentListItemSchema = DocumentResponseSchema.pick({
	id: true,
	codeNumber: true,
	title: true,
	type: true,
	purpose: true,
	source: true,
	status: true,
	classification: true,
	remarks: true,
	receivedAt: true,
}).extend({
	/** callerSlipId of the linked invitation (only for invitation documents) */
	callerSlipId: z.string().nullable().optional(),
});

export const DocumentListPaginationSchema = z.object({
	total: z.number().int().min(0),
	page: z.number().int().min(1),
	limit: z.number().int().min(1),
	totalPages: z.number().int().min(0),
});

export const DocumentListResponseSchema = z.object({
	items: DocumentListItemSchema.array(),
	pagination: DocumentListPaginationSchema,
});

export const GetDocumentListSchema = z.object({
	tab: DocumentListTabEnum.default("all"),
	search: z.string().trim().max(TEXT_LIMITS.SM).optional(),
	status: StatusTypeEnum.optional(),
	type: DocumentTypeEnum.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	sortBy: DocumentSortByEnum.default("receivedAt"),
	sortOrder: SortOrderEnum.default("desc"),
});

export const GetDocumentByIdSchema = z.object({
	id: z.uuid(),
});

export const DocumentDetailSchema = DocumentResponseSchema.extend({
	versions: DocumentVersionWithSignedUrlSchema.extend({
		createdAt: z.iso.datetime(),
	}).array(),
	auditTrail: DocumentAuditResponseSchema.array(),
});

export const CreateDocumentSchema = z
	.object({
		source: SourceTypeEnum,
		type: DocumentTypeEnum,
		title: z.string().trim().min(1).max(TEXT_LIMITS.SM),
		purpose: PurposeTypeEnum,
		classification: ClassificationTypeEnum.nullable().optional(),
		remarks: z.string().trim().max(TEXT_LIMITS.MD).nullable().optional(),
		filePath: z.string().trim().min(1),
		eventVenue: z.string().trim().min(1).optional(),
		eventStartTime: z.iso.datetime().optional(),
		eventEndTime: z.iso.datetime().optional(),
	})
	.superRefine((input, ctx) => {
		if (
			!isPurposeAllowed(
				input.type as DocumentType,
				input.purpose as PurposeType,
			)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["purpose"],
				message: "Invalid purpose for this document type",
			});
		}

		if (input.type === "invitation") {
			if (!input.eventVenue) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["eventVenue"],
					message: "Event venue is required for invitation documents",
				});
			}

			if (!input.eventStartTime) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["eventStartTime"],
					message: "Event start time is required for invitation documents",
				});
			}

			if (!input.eventEndTime) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["eventEndTime"],
					message: "Event end time is required for invitation documents",
				});
			}
		}
	});

export const CreateDocumentResponseSchema = z.object({
	id: z.string(),
	codeNumber: z.string(),
	status: StatusTypeEnum,
});

export const UpdateDocumentStatusSchema = z.object({
	id: z.uuid(),
	status: StatusTypeEnum,
	remarks: z.string().trim().max(TEXT_LIMITS.MD).optional(),
});

export const CreateDocumentVersionSchema = z.object({
	id: z.uuid(),
	filePath: z.string().trim().min(1),
	resetStatus: z.boolean().default(true),
});

export const CreateDocumentUploadUrlSchema = z.object({
	documentId: z.uuid().optional(),
	fileName: z.string().trim().min(1).max(TEXT_LIMITS.SM),
	contentType: z.literal("application/pdf"),
	fileSizeBytes: z.number().int().positive().max(FILE_SIZE_LIMITS.MD),
});

export const CreateDocumentUploadUrlResponseSchema = z.object({
	fileName: z.string(),
	path: z.string(),
	signedUrl: z.url(),
	token: z.string(),
});

export const DeleteDocumentUploadSchema = z.object({
	path: z.string().trim().min(1),
	documentId: z.uuid().optional(),
});

export const DeleteDocumentUploadResponseSchema = z.object({
	cleanedUp: z.boolean(),
});

export const UpdateDocumentSchema = z
	.object({
		id: z.uuid(),
		updatedAt: z.iso.datetime().optional(),
		title: z.string().trim().min(1).max(TEXT_LIMITS.SM).optional(),
		source: SourceTypeEnum.optional(),
		remarks: z.string().trim().max(TEXT_LIMITS.MD).nullable().optional(),
		classification: ClassificationTypeEnum.nullable().optional(),
		type: DocumentTypeEnum.optional(),
		purpose: PurposeTypeEnum.optional(),
		eventVenue: z.string().trim().min(1).nullable().optional(),
		eventStartTime: z.iso.datetime().nullable().optional(),
		eventEndTime: z.iso.datetime().nullable().optional(),
	})
	.superRefine((input, ctx) => {
		const hasType = input.type !== undefined;
		const hasPurpose = input.purpose !== undefined;

		if (hasType !== hasPurpose) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["purpose"],
				message: "type and purpose must be updated together",
			});
		}

		if (
			input.type &&
			input.purpose &&
			!isPurposeAllowed(
				input.type as DocumentType,
				input.purpose as PurposeType,
			)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["purpose"],
				message: "Invalid purpose for this document type",
			});
		}
	});

// Types
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;
export type DocumentTypeEnumType = z.infer<typeof DocumentTypeEnum>;
export type LegislativeDocumentTypeEnumType = z.infer<
	typeof LegislativeDocumentTypeEnum
>;
export type PurposeTypeEnumType = z.infer<typeof PurposeTypeEnum>;
export type SourceTypeEnumType = z.infer<typeof SourceTypeEnum>;
export type StatusTypeEnumType = z.infer<typeof StatusTypeEnum>;
export type ClassificationTypeEnumType = z.infer<typeof ClassificationTypeEnum>;
export type DocumentListTab = z.infer<typeof DocumentListTabEnum>;
export type SortOrder = z.infer<typeof SortOrderEnum>;
export type DocumentSortBy = z.infer<typeof DocumentSortByEnum>;
export type DocumentListItem = z.infer<typeof DocumentListItemSchema>;
export type DocumentListPagination = z.infer<
	typeof DocumentListPaginationSchema
>;
export type DocumentListResponse = z.infer<typeof DocumentListResponseSchema>;
export type GetDocumentListInput = z.infer<typeof GetDocumentListSchema>;
export type GetDocumentByIdInput = z.infer<typeof GetDocumentByIdSchema>;
export type DocumentDetail = z.infer<typeof DocumentDetailSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type CreateDocumentResponse = z.infer<
	typeof CreateDocumentResponseSchema
>;
export type UpdateDocumentStatusInput = z.infer<
	typeof UpdateDocumentStatusSchema
>;
export type CreateDocumentVersionInput = z.infer<
	typeof CreateDocumentVersionSchema
>;
export type CreateDocumentUploadUrlInput = z.infer<
	typeof CreateDocumentUploadUrlSchema
>;
export type CreateDocumentUploadUrlResponse = z.infer<
	typeof CreateDocumentUploadUrlResponseSchema
>;
export type DeleteDocumentUploadInput = z.infer<
	typeof DeleteDocumentUploadSchema
>;
export type DeleteDocumentUploadResponse = z.infer<
	typeof DeleteDocumentUploadResponseSchema
>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
