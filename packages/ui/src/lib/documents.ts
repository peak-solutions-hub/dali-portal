import type { LegislativeDocumentWithDetails } from "@repo/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
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
 * // In Client Component
 * import { createSupabaseBrowserClient } from "@repo/ui/lib";
 * import { getDocumentPdfUrl } from "@repo/shared";
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
 * import { createSupabaseBrowserClient } from "@repo/ui/lib";
 * import { getDocumentsPdfUrls } from "@repo/shared";
 *
 * const supabase = createSupabaseBrowserClient();
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
