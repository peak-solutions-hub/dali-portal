import type { SupabaseClient } from "@supabase/supabase-js";
import { getSignedUrls } from "./storage";

export interface AttachmentWithUrl {
	path: string;
	signedUrl?: string;
	fileName: string;
}

/**
 * Get signed URLs for attachment paths
 * Extracts file names and generates signed URLs for display
 *
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name (default: "attachments")
 * @param paths - Array of attachment paths
 * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns Array of attachments with signed URLs and file names
 *
 * @example
 * ```typescript
 * const supabase = createSupabaseServerClient();
 * const attachments = await getAttachmentUrls(supabase, "attachments", message.attachmentPaths);
 * // Returns: [{ path: "inquiries/123.pdf", signedUrl: "...", fileName: "123.pdf" }]
 * ```
 */
export async function getAttachmentUrls(
	supabase: SupabaseClient,
	bucket: string = "attachments",
	paths: string[] | null | undefined,
	expiresIn: number = 3600,
): Promise<AttachmentWithUrl[]> {
	if (!paths || paths.length === 0) {
		return [];
	}

	// Filter out invalid paths
	const validPaths = paths.filter((p) => p && p.trim().length > 0);

	if (validPaths.length === 0) {
		return [];
	}

	const results = await getSignedUrls(supabase, bucket, validPaths, expiresIn);

	return results.map(({ path, signedUrl }) => ({
		path,
		signedUrl,
		fileName: extractFileName(path),
	}));
}

/**
 * Extract file name from a path
 * @param path - File path
 * @returns File name without path
 */
function extractFileName(path: string): string {
	const parts = path.split("/");
	const fileName = parts[parts.length - 1] || path;

	// Remove timestamp prefix if present (e.g., "1706123456789-abc123.pdf" -> "abc123.pdf")
	const match = fileName.match(/^\d+-(.+)$/);
	if (match && match[1]) {
		return match[1];
	}

	return fileName;
}

/**
 * Get signed URLs for multiple messages' attachments
 * Useful for batch processing inquiry messages
 *
 * @param supabase - Supabase client instance
 * @param messages - Array of messages with attachmentPaths
 * @param bucket - Storage bucket name (default: "attachments")
 * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns Map of message ID to attachments with signed URLs
 */
export async function getMessagesAttachmentUrls<
	T extends { id: string; attachmentPaths: string[] | null },
>(
	supabase: SupabaseClient,
	messages: T[],
	bucket: string = "attachments",
	expiresIn: number = 3600,
): Promise<Map<string, AttachmentWithUrl[]>> {
	const result = new Map<string, AttachmentWithUrl[]>();

	await Promise.all(
		messages.map(async (msg) => {
			const attachments = await getAttachmentUrls(
				supabase,
				bucket,
				msg.attachmentPaths,
				expiresIn,
			);
			result.set(msg.id, attachments);
		}),
	);

	return result;
}
