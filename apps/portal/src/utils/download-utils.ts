import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Download utilities for handling file downloads with proper memory management
 * and cross-browser compatibility (including Safari)
 */

/**
 * Download a file from Supabase Storage using blob-based approach
 * This ensures proper "Save As" behavior in all browsers including Safari
 *
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

		try {
			// Create temporary anchor element
			const link = window.document.createElement("a");
			link.href = blobUrl;
			link.download = filename;

			// Add to DOM (required for Firefox)
			link.style.display = "none";
			window.document.body.appendChild(link);

			// Trigger download
			link.click();

			// Clean up: Remove link from DOM
			window.document.body.removeChild(link);
		} finally {
			// Clean up: Revoke blob URL to prevent memory leaks
			// Use setTimeout to ensure download starts before revocation
			setTimeout(() => {
				window.URL.revokeObjectURL(blobUrl);
			}, 100);
		}
	} catch (error) {
		console.error("Download failed:", error);
		toast.error("Failed to download file", {
			description: "Please try again or contact support if the issue persists.",
		});
		throw error;
	}
}

/**
 * Download a file from a direct URL using fetch and blob
 * This is useful for signed URLs or public files
 * Ensures proper "Save As" dialog in Safari and other browsers
 *
 * @param url - Direct URL to the file
 * @param filename - The desired filename for the download
 */
export async function downloadFileFromUrl(
	url: string,
	filename: string,
): Promise<void> {
	try {
		// Fetch the file as a blob
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const blob = await response.blob();

		// Create object URL from blob
		const blobUrl = window.URL.createObjectURL(blob);

		try {
			// Create temporary anchor element
			const link = window.document.createElement("a");
			link.href = blobUrl;
			link.download = filename;

			// Add to DOM (required for Firefox)
			link.style.display = "none";
			window.document.body.appendChild(link);

			// Trigger download
			link.click();

			// Clean up: Remove link from DOM
			window.document.body.removeChild(link);
		} finally {
			// Clean up: Revoke blob URL to prevent memory leaks
			// Use setTimeout to ensure download starts before revocation
			setTimeout(() => {
				window.URL.revokeObjectURL(blobUrl);
			}, 100);
		}
	} catch (error) {
		console.error("Download failed:", error);
		toast.error("Failed to download file", {
			description: "Please try again or contact support if the issue persists.",
		});
		throw error;
	}
}
