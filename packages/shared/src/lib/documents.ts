import type { SupabaseClient } from "@supabase/supabase-js";
import type { LegislativeDocumentWithDetails } from "../schemas/legislative-document.schema";

/**
 * Get a signed URL for a file in Supabase Storage
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if error
 */
export async function getSignedUrl(
	supabase: SupabaseClient,
	bucket: string,
	path: string,
	expiresIn = 3600,
): Promise<string | undefined> {
	const { data, error } = await supabase.storage
		.from(bucket)
		.createSignedUrl(path, expiresIn);

	if (error) {
		return undefined;
	}

	return data.signedUrl;
}

/**
 * Get a signed URL for a legislative document's PDF file
 * @param supabase - Supabase client instance
 * @param document - Legislative document with storage information
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if document has no file
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
