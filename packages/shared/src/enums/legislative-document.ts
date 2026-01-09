/**
 * Legislative Document Types
 * These are the approved/enacted document types in the legislative_document table
 * Different from DocumentType which includes proposed_ prefix for documents table
 */
export const LegislativeDocumentType = {
	ORDINANCE: "ordinance",
	RESOLUTION: "resolution",
} as const;

export type LegislativeDocumentType =
	(typeof LegislativeDocumentType)[keyof typeof LegislativeDocumentType];

export const LEGISLATIVE_DOCUMENT_TYPE_VALUES: LegislativeDocumentType[] =
	Object.values(LegislativeDocumentType);
