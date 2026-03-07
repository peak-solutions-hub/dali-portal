"use client";
import {
	getDocumentFilename,
	isValidPdfUrl,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	BRAND_BUTTON_CLASS,
	BRAND_SPINNER_CLASS,
} from "@repo/ui/lib/legislative-document-ui";
import {
	Download,
	ExternalLink,
	FileText,
	Loader2,
	Printer,
} from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/client";
import { useCallback, useState } from "react";
import { downloadFile } from "@/utils/download-utils";

interface DocumentViewerProps {
	document: LegislativeDocumentWithDetails;
	/** Server-generated signed URL for the PDF */
	pdfUrl?: string;
}

export function DocumentViewer({ document, pdfUrl }: DocumentViewerProps) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [isPreviewLoading, setIsPreviewLoading] = useState(true);

	const documentTitle =
		document.displayTitle || document.document?.title || "Untitled Document";
	const downloadFilename = getDocumentFilename(document);

	const isValidUrl = pdfUrl ? isValidPdfUrl(pdfUrl) : false;
	const hasValidPdf = pdfUrl && isValidUrl;

	const handleDownload = useCallback(async () => {
		if (!pdfUrl || !document.storagePath || !document.storageBucket) return;

		setIsDownloading(true);
		try {
			const supabase = createBrowserClient();
			await downloadFile(
				supabase,
				document.storageBucket,
				document.storagePath,
				downloadFilename,
			);
		} catch {
			// Error already logged and handled by downloadFile
		} finally {
			setIsDownloading(false);
		}
	}, [pdfUrl, downloadFilename, document]);

	return (
		<div className="flex flex-col gap-4">
			{/* Desktop Iframe Wrapper */}
			<div className="hidden md:flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-200">
				<div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0">
					<div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
						<FileText className="w-4 h-4" />
						Document Preview
					</div>
					<div className="flex items-center gap-4 text-gray-500 text-sm">
						<button
							onClick={() => window.print()}
							className="flex items-center gap-1 hover:text-gray-900 transition-colors"
						>
							<Printer className="w-4 h-4" />
							<span>Print</span>
						</button>
						{hasValidPdf && (
							<a
								href={pdfUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1 hover:text-gray-900 transition-colors"
							>
								<ExternalLink className="w-4 h-4" />
								<span>Open</span>
							</a>
						)}
					</div>
				</div>

				{!hasValidPdf && (
					<div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
						<div className="text-center">
							<FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
							<h3 className="text-sm font-medium text-gray-900 mb-1">
								Preview Unavailable
							</h3>
							<p className="text-sm text-gray-500">
								The PDF document cannot be viewed at this time.
							</p>
						</div>
					</div>
				)}

				{hasValidPdf && (
					<div className="relative flex-1 bg-gray-100">
						{isPreviewLoading && (
							<div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 gap-3">
								<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
								<p className="text-sm text-gray-500">
									Loading document preview...
								</p>
							</div>
						)}
						<iframe
							src={pdfUrl}
							className="w-full h-full border-none"
							title={`Preview of ${documentTitle}`}
							onLoad={() => setIsPreviewLoading(false)}
						/>
					</div>
				)}
			</div>

			{/* Mobile Open Button Wrapper */}
			<div className="md:hidden bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
				<FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Document Preview
				</h3>
				<p className="text-gray-500 text-sm mb-6">
					View the complete document in a new tab.
				</p>
				{hasValidPdf ? (
					<a
						href={pdfUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg font-medium transition"
					>
						<ExternalLink className="w-4 h-4" />
						Open in New Tab
					</a>
				) : (
					<p className="text-sm text-amber-600">
						Document URL is not available.
					</p>
				)}
			</div>

			{/* Download Button */}
			<Button
				onClick={handleDownload}
				disabled={isDownloading || !hasValidPdf}
				className={`w-full ${BRAND_BUTTON_CLASS} text-white py-6 sm:py-7 text-base font-medium rounded-xl shadow-sm transition-all`}
			>
				{isDownloading ? (
					<Loader2 className="w-5 h-5 animate-spin mr-2" />
				) : (
					<Download className="w-5 h-5 mr-2" />
				)}
				Download Full Document (PDF)
			</Button>
		</div>
	);
}
