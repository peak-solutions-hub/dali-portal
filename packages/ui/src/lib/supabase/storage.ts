import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get a signed URL for a file in Supabase Storage
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if error
 *
 * @example
 * ```typescript
 * const supabase = createSupabaseBrowserClient();
 * const url = await getSignedUrl(supabase, "documents", "2024/file.pdf");
 * ```
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
 * Get signed URLs for multiple files
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name
 * @param paths - Array of file paths
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Array of signed URLs
 *
 * @example
 * ```typescript
 * const supabase = createSupabaseBrowserClient();
 * const results = await getSignedUrls(supabase, "documents", ["file1.pdf", "file2.pdf"]);
 * ```
 */
export async function getSignedUrls(
	supabase: SupabaseClient,
	bucket: string,
	paths: string[],
	expiresIn = 3600,
): Promise<Array<{ path: string; signedUrl?: string }>> {
	const results = await Promise.all(
		paths.map(async (path) => {
			const signedUrl = await getSignedUrl(supabase, bucket, path, expiresIn);
			return { path, signedUrl };
		}),
	);

	return results;
}

/**
 * Get a public URL for a file (for public buckets only)
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @returns Public URL
 *
 * @example
 * ```typescript
 * const supabase = createSupabaseBrowserClient();
 * const url = getPublicUrl(supabase, "public-files", "logo.png");
 * ```
 */
export function getPublicUrl(
	supabase: SupabaseClient,
	bucket: string,
	path: string,
): string {
	const { data } = supabase.storage.from(bucket).getPublicUrl(path);
	return data.publicUrl;
}
