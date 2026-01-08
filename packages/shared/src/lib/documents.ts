import type { SupabaseClient } from "@supabase/supabase-js";
import type { LegislativeDocumentWithDetails } from "../schemas/legislative-document.schema";
import { getSignedUrl } from "./supabase/storage";

/**
 * Get a signed URL for a legislative document's PDF file
 * @param supabase - Supabase client instance
 * @param document - Legislative document with storage information
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if document has no file
 *
 * @example
 * ```typescript
 * // In Server Component
 * import { createSupabaseServerClient, getDocumentPdfUrl } from "@repo/shared";
 *
 * const supabase = await createSupabaseServerClient();
 * const pdfUrl = await getDocumentPdfUrl(supabase, document);
 * ```
 *
 * @example
 * ```typescript
 * // In Client Component
 * import { createSupabaseBrowserClient, getDocumentPdfUrl } from "@repo/shared";
 *
 * const supabase = createSupabaseBrowserClient();
 * const pdfUrl = await getDocumentPdfUrl(supabase, document);
 * ```
 */
export async function getDocumentPdfUrl(
	supabase: SupabaseClient,
	document: LegislativeDocumentWithDetails,
	expiresIn = 3600,
): Promise<string | undefined> {
	if (!document.storageBucket || !document.storagePath) {
		return undefined;
	}

	return await getSignedUrl(
		supabase,
		document.storageBucket,
		document.storagePath,
		expiresIn,
	);
}

/**
 * Get signed URLs for multiple legislative documents
 * @param supabase - Supabase client instance
 * @param documents - Array of legislative documents
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Array of documents with their signed URLs
 *
 * @example
 * ```typescript
 * import { createSupabaseServerClient, getDocumentsPdfUrls } from "@repo/shared";
 *
 * const supabase = await createSupabaseServerClient();
 * const documentsWithUrls = await getDocumentsPdfUrls(supabase, documents);
 * ```
 */
export async function getDocumentsPdfUrls(
	supabase: SupabaseClient,
	documents: LegislativeDocumentWithDetails[],
	expiresIn = 3600,
): Promise<Array<LegislativeDocumentWithDetails & { pdfUrl?: string }>> {
	const documentsWithUrls = await Promise.all(
		documents.map(async (doc) => {
			const pdfUrl = await getDocumentPdfUrl(supabase, doc, expiresIn);
			return { ...doc, pdfUrl };
		}),
	);

	return documentsWithUrls;
}
