"use client";

import { Button } from "@repo/ui/components/button";
import { Download, Loader2 } from "@repo/ui/lib/lucide-react";
import { useCallback, useState } from "react";
import { downloadFileFromUrl } from "@/utils/download-utils";

interface DocumentDownloadButtonProps {
	pdfUrl?: string;
	filename: string;
	/** Optional label override; defaults to "Download" */
	label?: string;
	className?: string;
	/** Accessible description, e.g. "Download PDF for Ordinance 123" */
	ariaLabel?: string;
}

export function DocumentDownloadButton({
	pdfUrl,
	filename,
	label = "Download",
	className = "min-w-30",
	ariaLabel,
}: DocumentDownloadButtonProps) {
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = useCallback(async () => {
		if (!pdfUrl) return;

		setIsDownloading(true);
		try {
			await downloadFileFromUrl(pdfUrl, filename);
		} catch {
			// Error already logged and handled by downloadFile
		} finally {
			setIsDownloading(false);
		}
	}, [pdfUrl, filename]);

	return (
		<Button
			variant="outline"
			title="Download PDF"
			onClick={handleDownload}
			disabled={isDownloading || !pdfUrl}
			className={className}
			aria-label={
				isDownloading
					? "Downloading PDF..."
					: (ariaLabel ?? `Download ${filename}`)
			}
			aria-busy={isDownloading}
		>
			{isDownloading ? (
				<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
			) : (
				<>
					<Download className="w-4 h-4 mr-2" aria-hidden="true" />
					{label}
				</>
			)}
		</Button>
	);
}
