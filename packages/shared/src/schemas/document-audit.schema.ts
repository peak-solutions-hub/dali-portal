import { z } from "zod";

/**
 * Document audit schema (from document_audit table + actor join)
 */
export const DocumentAuditSchema = z.object({
	id: z.uuid(),
	actorId: z.uuid(),
	actorName: z.string(),
	documentId: z.uuid(),
	versionNumber: z.number(),
	filePath: z.string(),
	remarks: z.string().nullable(),
	action: z.string(),
	createdAt: z.coerce.date(),
});

export const DocumentAuditResponseSchema = DocumentAuditSchema.extend({
	createdAt: z.iso.datetime(),
});

export type DocumentAudit = z.infer<typeof DocumentAuditSchema>;
export type DocumentAuditResponse = z.infer<typeof DocumentAuditResponseSchema>;
