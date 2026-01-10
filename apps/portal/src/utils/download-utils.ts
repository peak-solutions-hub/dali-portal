import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Download utilities for handling file downloads with proper memory management
 */

/**
 * Download a file from Supabase Storage using the download() method
 * This prevents exposing signed URLs by fetching the file as a blob
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name
 * @param path - File path in the bucket
 * @param filename - The desired filename for the download
 */
export async function downloadFile(
	supabase: SupabaseClient,
	bucket: string,
	path: string,
	filename: string,
): Promise<void> {
	try {
		// Download file as blob from Supabase Storage
		const { data: blob, error } = await supabase.storage
			.from(bucket)
			.download(path);

		if (error) {
			throw error;
		}

		if (!blob) {
			throw new Error("No file data received");
		}

		// Create object URL from blob
		const blobUrl = window.URL.createObjectURL(blob);

		// Create and trigger download link
		const link = window.document.createElement("a");
		link.href = blobUrl;
		link.download = filename;
		window.document.body.appendChild(link);
		link.click();
		window.document.body.removeChild(link);

		// Clean up the blob URL
		window.URL.revokeObjectURL(blobUrl);
	} catch (error) {
		console.error("Download failed:", error);
		toast.error("Failed to download file", {
			description: "Please try again or contact support if the issue persists.",
		});
		throw error;
	}
}
