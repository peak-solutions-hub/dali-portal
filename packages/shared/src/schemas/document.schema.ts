import { z } from "zod";
import { TEXT_LIMITS } from "../constants";
import {
	CLASSIFICATION_TYPE_VALUES,
	DOCUMENT_TYPE_VALUES,
	PURPOSE_TYPE_VALUES,
	SOURCE_TYPE_VALUES,
	STATUS_TYPE_VALUES,
} from "../enums/document";

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

/**
 * Base Document schema (from document table)
 */
export const DocumentSchema = z.object({
	id: z.uuid(),
	codeNumber: z.string(),
	title: z.string().min(1).max(TEXT_LIMITS.SM),
	type: DocumentTypeEnum,
	purpose: PurposeTypeEnum,
	source: SourceTypeEnum,
	status: StatusTypeEnum,
	classification: ClassificationTypeEnum,
	remarks: z.string().max(TEXT_LIMITS.MD).nullable(),
	receivedAt: z.coerce.date(),
});

// Types
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentTypeEnumType = z.infer<typeof DocumentTypeEnum>;
export type LegislativeDocumentTypeEnumType = z.infer<
	typeof LegislativeDocumentTypeEnum
>;
export type PurposeTypeEnumType = z.infer<typeof PurposeTypeEnum>;
export type SourceTypeEnumType = z.infer<typeof SourceTypeEnum>;
export type StatusTypeEnumType = z.infer<typeof StatusTypeEnum>;
export type ClassificationTypeEnumType = z.infer<typeof ClassificationTypeEnum>;
