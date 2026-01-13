"use client";
import {
	getDocumentFilename,
	isValidPdfUrl,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { useBodyScrollLock, useFocusTrap, useIsMobile } from "@repo/ui/hooks";
import { getDocumentPdfUrl } from "@repo/ui/lib/documents";
import { Download, FileText, Loader2, X } from "@repo/ui/lib/lucide-react";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { downloadFile } from "@/utils/download-utils";

interface PDFViewerProps {
	document: LegislativeDocumentWithDetails;
}

export function PDFViewer({ document }: PDFViewerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [pdfUrl, setPdfUrl] = useState<string | undefined>();
	const [isLoadingUrl, setIsLoadingUrl] = useState(true);
	const [urlError, setUrlError] = useState(false);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const modalRef = useRef<HTMLDivElement | null>(null);

	const isMobile = useIsMobile();
	useBodyScrollLock(isOpen);
	useFocusTrap({
		isActive: isOpen,
		containerRef: modalRef,
		triggerRef,
		onEscape: () => setIsOpen(false),
	});

	const documentTitle =
		document.displayTitle || document.document?.title || "Untitled Document";
	const downloadFilename = getDocumentFilename(document);

	// Generate signed URL when component mounts
	useEffect(() => {
		if (document.storagePath && document.storageBucket) {
			setIsLoadingUrl(true);
			setUrlError(false);
			const supabase = createSupabaseBrowserClient();
			getDocumentPdfUrl(supabase, document)
				.then((url) => {
					if (url) {
						setPdfUrl(url);
					} else {
						setUrlError(true);
					}
				})
				.catch(() => {
					setUrlError(true);
				})
				.finally(() => {
					setIsLoadingUrl(false);
				});
		} else {
			setIsLoadingUrl(false);
			setUrlError(true);
		}
	}, [document]);

	const isValidUrl = pdfUrl ? isValidPdfUrl(pdfUrl) : false;

	const handleDownload = useCallback(async () => {
		if (!pdfUrl || !document.storagePath || !document.storageBucket) return;

		setIsDownloading(true);
		try {
			const supabase = createSupabaseBrowserClient();
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

	// Show loading state while generating PDF URL
	if (isLoadingUrl) {
		return (
			<div className="mb-4 sm:mb-6">
				<div className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
					<Loader2
						className="w-5 h-5 animate-spin text-[#a60202]"
						aria-hidden="true"
					/>
					<span className="text-sm text-gray-600">Loading document...</span>
				</div>
			</div>
		);
	}

	// Show error state if PDF URL generation failed
	if (urlError || !pdfUrl || !isValidUrl) {
		return (
			<div className="mb-4 sm:mb-6">
				<div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
					<div className="flex items-start gap-3">
						<FileText
							className="w-5 h-5 text-amber-600 mt-0.5"
							aria-hidden="true"
						/>
						<div className="flex-1">
							<h3 className="text-sm font-medium text-amber-800">
								PDF Unavailable
							</h3>
							<p className="text-sm text-amber-700 mt-1">
								The PDF document cannot be viewed at this time. The file may be
								missing or there was an error generating the viewing URL.
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mb-4 sm:mb-6">
			{/* View Button - Opens in modal or new tab */}
			<div
				className="flex flex-col sm:flex-row gap-3"
				role="group"
				aria-label="Document actions"
			>
				<Button
					ref={triggerRef}
					onClick={() => setIsOpen(true)}
					variant="outline"
					className="w-full sm:w-auto border-2 border-[#a60202] text-[#a60202] hover:bg-[#a60202] hover:text-white px-8 py-6"
					aria-label={`View PDF document: ${documentTitle}`}
				>
					<FileText className="w-5 h-5 mr-2" aria-hidden="true" />
					View PDF Document
				</Button>

				{/* Download Button - Instant download */}
				<Button
					onClick={handleDownload}
					disabled={isDownloading}
					className="w-full sm:w-auto sm:min-w-45 border-2 border- bg-[#a60202] hover:bg-[#8a0101] text-white px-8 py-6"
					aria-label={
						isDownloading
							? "Downloading PDF..."
							: `Download PDF: ${downloadFilename}`
					}
					aria-busy={isDownloading}
				>
					{isDownloading ? (
						<Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
					) : (
						<>
							<Download className="w-5 h-5 mr-2" aria-hidden="true" />
							Download PDF
						</>
					)}
				</Button>
			</div>

			{/* PDF Viewer Modal */}
			{isOpen && (
				<>
					{isMobile ? (
						<div
							ref={modalRef}
							className="fixed inset-0 z-50 bg-white flex flex-col h-dvh"
							role="dialog"
							aria-modal="true"
							aria-labelledby="pdf-modal-title"
						>
							<div className="shrink-0 bg-[#a60202] text-white p-4 flex items-center justify-between gap-4">
								<h2
									id="pdf-modal-title"
									className="text-base font-semibold truncate flex-1"
								>
									{documentTitle}
								</h2>
								<Button
									onClick={() => setIsOpen(false)}
									size="sm"
									variant="ghost"
									className="text-white hover:bg-white/20"
									aria-label="Close PDF viewer"
								>
									<X className="h-4 w-4" aria-hidden="true" />
								</Button>
							</div>

							<div className="flex-1 overflow-hidden">
								<object
									data={pdfUrl}
									type="application/pdf"
									className="w-full h-full"
									title={documentTitle}
								>
									<div className="flex flex-col items-center justify-center h-full p-4 text-center">
										<p className="text-gray-600 mb-4">
											Unable to display PDF in browser. Please download the
											file.
										</p>
										<Button
											onClick={handleDownload}
											disabled={isDownloading}
											className="bg-[#a60202] hover:bg-[#8a0101]"
										>
											{isDownloading ? (
												<Loader2
													className="w-4 h-4 animate-spin"
													aria-hidden="true"
												/>
											) : (
												"Download PDF"
											)}
										</Button>
									</div>
								</object>
							</div>
						</div>
					) : (
						<>
							<div
								className="fixed inset-0 z-50 bg-black/50"
								onClick={() => setIsOpen(false)}
								aria-hidden="true"
							/>
							<div
								ref={modalRef}
								className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50 w-[90vw] max-w-350 h-[90vh] bg-white rounded-lg shadow-lg flex flex-col"
								role="dialog"
								aria-modal="true"
								aria-labelledby="pdf-modal-title-desktop"
							>
								<div className="shrink-0 bg-[#a60202] text-white p-4 rounded-t-lg flex items-center justify-between gap-4">
									<h2
										id="pdf-modal-title-desktop"
										className="text-lg font-semibold truncate flex-1"
									>
										{documentTitle}
									</h2>
									<Button
										onClick={() => setIsOpen(false)}
										size="sm"
										variant="ghost"
										className="text-white hover:bg-white/20"
										aria-label="Close PDF viewer"
									>
										<X className="h-4 w-4" aria-hidden="true" />
									</Button>
								</div>

								<div className="flex-1 overflow-auto p-4 bg-gray-50">
									<object
										data={pdfUrl}
										type="application/pdf"
										className="w-full h-full border border-gray-300 rounded bg-white"
										title={documentTitle}
									>
										<div className="flex flex-col items-center justify-center h-full p-8 text-center">
											<p className="text-gray-600 mb-4">
												Unable to display PDF in browser. Please download the
												file.
											</p>
											<Button
												onClick={handleDownload}
												disabled={isDownloading}
												className="bg-[#a60202] hover:bg-[#8a0101]"
											>
												{isDownloading ? (
													<Loader2
														className="w-4 h-4 animate-spin"
														aria-hidden="true"
													/>
												) : (
													"Download PDF"
												)}
											</Button>
										</div>
									</object>
								</div>
							</div>
						</>
					)}
				</>
			)}
		</div>
	);
}
