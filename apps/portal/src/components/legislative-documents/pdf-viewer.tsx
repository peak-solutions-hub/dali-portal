"use client";
import {
	getDocumentFilename,
	isValidPdfUrl,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { useBodyScrollLock, useFocusTrap, useIsMobile } from "@repo/ui/hooks";
import { Download, FileText, Loader2, X } from "@repo/ui/lib/lucide-react";
import { useCallback, useRef, useState } from "react";

interface PDFViewerProps {
	document: LegislativeDocumentWithDetails;
}

export function PDFViewer({ document }: PDFViewerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
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

	const pdfUrl = document.pdfUrl;
	const documentTitle =
		document.displayTitle || document.document?.title || "Untitled Document";
	const downloadFilename = getDocumentFilename(document);

	const isValidUrl = pdfUrl ? isValidPdfUrl(pdfUrl) : false;

	const handleDownload = useCallback(async () => {
		if (!pdfUrl) return;

		setIsDownloading(true);
		try {
			const response = await fetch(pdfUrl);
			if (!response.ok) {
				throw new Error("Failed to download file");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = window.document.createElement("a");
			link.href = url;
			link.download = downloadFilename;
			window.document.body.appendChild(link);
			link.click();
			window.document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Download failed:", error);
			// Fallback: open in new tab if fetch fails
			window.open(pdfUrl, "_blank");
		} finally {
			setIsDownloading(false);
		}
	}, [pdfUrl, downloadFilename]);

	const handleViewInNewTab = useCallback(() => {
		if (pdfUrl) {
			window.open(pdfUrl, "_blank", "noopener,noreferrer");
		}
	}, [pdfUrl]);

	if (!pdfUrl || !isValidUrl) {
		return (
			<div className="bg-gray-100 rounded-lg p-8 sm:p-12 mb-4 sm:mb-6 flex flex-col items-center justify-center min-h-75 sm:min-h-100">
				<p className="text-gray-600 mb-4 text-sm sm:text-base">
					PDF Document Preview
				</p>
				<p className="text-xs sm:text-sm text-gray-500">
					{!pdfUrl ? "PDF not available for public viewing" : "Invalid PDF URL"}
				</p>
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
					className="w-full sm:w-auto sm:min-w-45 bg-[#a60202] hover:bg-[#8a0101] text-white px-8 py-6"
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
								<div className="flex items-center gap-2">
									<Button
										onClick={handleViewInNewTab}
										size="sm"
										variant="ghost"
										className="text-white hover:bg-white/20 text-xs"
										aria-label="Open PDF in new browser tab"
									>
										Open in Tab
									</Button>
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
											Unable to display PDF in browser.
										</p>
										<Button
											onClick={handleViewInNewTab}
											className="bg-[#a60202] hover:bg-[#8a0101]"
										>
											Open PDF in New Tab
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
									<div className="flex items-center gap-2">
										<Button
											onClick={handleViewInNewTab}
											size="sm"
											variant="ghost"
											className="text-white hover:bg-white/20 text-xs"
											aria-label="Open PDF in new browser tab"
										>
											Open in New Tab
										</Button>
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
												Unable to display PDF in browser.
											</p>
											<Button
												onClick={handleViewInNewTab}
												className="bg-[#a60202] hover:bg-[#8a0101]"
											>
												Open PDF in New Tab
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
