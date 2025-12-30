"use client";
import {
	getDocumentFilename,
	isValidPdfUrl,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Download, FileText, X } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useBodyScrollLock, useFocusTrap, useIsMobile } from "@/hooks";

interface PDFViewerProps {
	document: LegislativeDocumentWithDetails;
}

export function PDFViewer({ document }: PDFViewerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const modalRef = useRef<HTMLDivElement | null>(null);

	// Use custom hooks for side effects
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

	// Validate PDF URL for security
	const isValidUrl = pdfUrl ? isValidPdfUrl(pdfUrl) : false;

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
			{/* Trigger Button */}
			<Button
				ref={triggerRef}
				onClick={() => setIsOpen(true)}
				variant="outline"
				className="w-full sm:w-auto border-2 border-[#a60202] text-[#a60202] hover:bg-[#a60202] hover:text-white px-8 py-6"
			>
				<FileText className="w-5 h-5 mr-2" />
				View PDF Document
			</Button>

			{/* Download Button */}
			<div className="mt-4">
				<Link href={pdfUrl} download={downloadFilename}>
					<Button className="w-full sm:w-auto bg-[#a60202] hover:bg-[#8a0101] text-white px-8 py-6">
						<Download className="w-5 h-5 mr-2" />
						Download PDF
					</Button>
				</Link>
			</div>

			{/* PDF Viewer */}
			{isOpen && (
				<>
					{isMobile ? (
						<div
							ref={modalRef}
							className="fixed inset-0 z-50 bg-white flex flex-col h-dvh"
						>
							<div className="shrink-0 bg-[#a60202] text-white p-4 flex items-center justify-between gap-4">
								<h2 className="text-base font-semibold truncate flex-1">
									{documentTitle}
								</h2>
								<div className="flex items-center gap-2">
									<Button
										onClick={() => setIsOpen(false)}
										size="sm"
										variant="ghost"
										className="text-white hover:bg-white/20"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div className="flex-1 overflow-hidden">
								<iframe src={pdfUrl} className="w-full h-full border-0" />
							</div>
						</div>
					) : (
						<>
							<div
								className="fixed inset-0 z-50 bg-black/50"
								onClick={() => setIsOpen(false)}
							/>
							<div
								ref={modalRef}
								className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50 w-[90vw] max-w-350 h-[90vh] bg-white rounded-lg shadow-lg flex flex-col"
							>
								<div className="shrink-0 bg-[#a60202] text-white p-4 rounded-t-lg flex items-center justify-between gap-4">
									<h2 className="text-lg font-semibold truncate flex-1">
										{documentTitle}
									</h2>
									<div className="flex items-center gap-2">
										<Button
											onClick={() => setIsOpen(false)}
											size="sm"
											variant="ghost"
											className="text-white hover:bg-white/20"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>

								<div className="flex-1 overflow-auto p-4 bg-gray-50">
									<iframe
										src={pdfUrl}
										className="w-full h-full border border-gray-300 rounded bg-white"
										title={documentTitle}
									/>
								</div>
							</div>
						</>
					)}
				</>
			)}
		</div>
	);
}
