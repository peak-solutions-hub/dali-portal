import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Forces a download by re-wrapping the blob as an octet-stream
 */
function triggerDownload(blob: Blob, filename: string) {
	// IMPORTANT: We create a NEW blob and force the type to octet-stream.
	// This prevents Safari from trying to "view" the PDF and forces a "download".
	const forcedBlob = new Blob([blob], { type: "application/octet-stream" });
	const blobUrl = window.URL.createObjectURL(forcedBlob);

	const link = window.document.createElement("a");
	link.href = blobUrl;
	link.download = filename;

	// Required for Firefox and some Safari versions
	link.style.display = "none";
	window.document.body.appendChild(link);

	link.click();

	// Cleanup
	setTimeout(() => {
		window.document.body.removeChild(link);
		window.URL.revokeObjectURL(blobUrl);
	}, 200);
}

export async function downloadFile(
	supabase: SupabaseClient,
	bucket: string,
	path: string,
	filename: string,
): Promise<void> {
	try {
		const { data: blob, error } = await supabase.storage
			.from(bucket)
			.download(path);

		if (error) throw error;
		if (!blob) throw new Error("No file data received");

		triggerDownload(blob, filename);
	} catch (error) {
		console.error("Download failed:", error);
		toast.error("Failed to download file");
		throw error;
	}
}

export async function downloadFileFromUrl(
	url: string,
	filename: string,
): Promise<void> {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

		const blob = await response.blob();
		triggerDownload(blob, filename);
	} catch (error) {
		console.error("Download failed:", error);
		toast.error("Failed to download file");
		throw error;
	}
}
