"use client";

import { Button } from "@repo/ui/components/button";
import { Download, Loader2 } from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/client";
import { useCallback, useState } from "react";
import { downloadFile } from "@/utils/download-utils";

interface DocumentDownloadButtonProps {
	storageBucket: string;
	storagePath: string;
	filename: string;
	/** Optional label override; defaults to "Download" */
	label?: string;
	className?: string;
	/** Accessible description, e.g. "Download PDF for Ordinance 123" */
	ariaLabel?: string;
}

export function DocumentDownloadButton({
	storageBucket,
	storagePath,
	filename,
	label = "Download",
	className = "min-w-30",
	ariaLabel,
}: DocumentDownloadButtonProps) {
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = useCallback(async () => {
		setIsDownloading(true);
		try {
			const supabase = createBrowserClient();
			await downloadFile(supabase, storageBucket, storagePath, filename);
		} catch {
			// Error already logged and handled by downloadFile
		} finally {
			setIsDownloading(false);
		}
	}, [storageBucket, storagePath, filename]);

	return (
		<Button
			variant="outline"
			title="Download PDF"
			onClick={handleDownload}
			disabled={isDownloading}
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
