import { z } from "zod";
import {
	ClassificationTypeEnum,
	DocumentSchema,
	LegislativeDocumentTypeEnum,
} from "./document.schema";
import { DocumentVersionSchema } from "./document-version.schema";

/**
 * Legislative Document schema (from legislative_document table)
 */
export const LegislativeDocumentSchema = z.object({
	id: z.number().int(),
	documentId: z.uuid(),
	officialNumber: z.string(),
	seriesYear: z.number().int().min(1950).max(2100),
	type: LegislativeDocumentTypeEnum,
	dateEnacted: z.coerce.date(),
	createdAt: z.coerce.date(),
	sponsorNames: z.array(z.string()).nullable(),
	authorNames: z.array(z.string()).nullable(),
});

/**
 * Legislative Document with related document details
 */
export const LegislativeDocumentWithDetailsSchema =
	LegislativeDocumentSchema.extend({
		document: DocumentSchema,
		displayTitle: z.string().optional(),
		displayType: z.string().optional(),
		displayClassification: z.string().optional(),
		pdfUrl: z.url().optional(),
		pdfFilename: z.string().optional(),
		latestVersion: DocumentVersionSchema.optional(),
	});

/**
 * Pagination info schema
 */
export const PaginationInfoSchema = z.object({
	currentPage: z.number().int().min(1),
	totalPages: z.number().int().min(0),
	totalItems: z.number().int().min(0),
	itemsPerPage: z.number().int().min(1),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
});

/**
 * Search/List legislative documents input
 */
export const GetLegislativeDocumentListSchema = z.object({
	search: z.string().optional(),
	type: LegislativeDocumentTypeEnum.optional(),
	year: z.coerce.number().int().min(2000).optional(),
	classification: ClassificationTypeEnum.optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Get legislative document by ID input
 */
export const GetLegislativeDocumentByIdSchema = z.object({
	id: z.coerce.number().int().positive(),
});

/**
 * Statistics for home page
 */
export const GetLatestLegislativeDocumentSchema = z.object({
	limit: z.coerce.number().int().min(1).max(5).default(5),
});

/**
 * Legislative documents list response
 */
export const LegislativeDocumentListResponseSchema = z.object({
	documents: z.array(LegislativeDocumentWithDetailsSchema),
	pagination: PaginationInfoSchema,
});

/**
 * Statistics for home page
 */
export const LegislativeDocumentStatisticsSchema = z.object({
	totalOrdinances: z.number().int().min(0),
	totalResolutions: z.number().int().min(0),
});

// Types
export type LegislativeDocument = z.infer<typeof LegislativeDocumentSchema>;
export type LegislativeDocumentWithDetails = z.infer<
	typeof LegislativeDocumentWithDetailsSchema
>;
export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;
export type GetLegislativeDocumentListInput = z.infer<
	typeof GetLegislativeDocumentListSchema
>;
export type GetLegislativeDocumentByIdInput = z.infer<
	typeof GetLegislativeDocumentByIdSchema
>;
export type GetLatestLegislativeDocumentInput = z.infer<
	typeof GetLatestLegislativeDocumentSchema
>;
export type LegislativeDocumentListResponse = z.infer<
	typeof LegislativeDocumentListResponseSchema
>;
export type LegislativeDocumentStatistics = z.infer<
	typeof LegislativeDocumentStatisticsSchema
>;
