import { z } from "zod";

/**
 * Document Version schema (from document_version table)
 */
export const DocumentVersionSchema = z.object({
	id: z.uuid(),
	documentId: z.uuid(),
	uploaderId: z.uuid(),
	versionNumber: z.number(),
	filePath: z.string(),
	createdAt: z.coerce.date(),
});

/**
 * Document Version with signed URL for file access
 */
export const DocumentVersionWithSignedUrlSchema = DocumentVersionSchema.extend({
	signedUrl: z.url(),
});

// Types
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
export type DocumentVersionWithSignedUrl = z.infer<
	typeof DocumentVersionWithSignedUrlSchema
>;

/**
 * Input schema for getting a document file URL
 */
export const GetDocumentFileUrlSchema = z.object({
	documentId: z.uuid(),
});

/**
 * Response schema for document file URL
 */
export const DocumentFileUrlResponseSchema = z.object({
	signedUrl: z.string(),
	fileName: z.string(),
	contentType: z.string().optional(),
});

// Types
export type GetDocumentFileUrlInput = z.infer<typeof GetDocumentFileUrlSchema>;
export type DocumentFileUrlResponse = z.infer<
	typeof DocumentFileUrlResponseSchema
>;
