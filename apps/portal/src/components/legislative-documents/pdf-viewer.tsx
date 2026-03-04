"use client";
import {
	formatDate,
	getClassificationLabel,
	getDocumentFilename,
	getDocumentNumber,
	getDocumentTypeLabel,
	isValidPdfUrl,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { getDocumentPdfUrl } from "@repo/ui/lib/documents";
import {
	Calendar,
	Download,
	FileText,
	Loader2,
	Tag,
	User,
	Users,
} from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
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

	const documentTitle =
		document.displayTitle || document.document?.title || "Untitled Document";
	const documentNumber = getDocumentNumber(document);
	const documentType = getDocumentTypeLabel(document.type);
	const classification = document.displayClassification
		? getClassificationLabel(document.displayClassification)
		: document.document?.classification
			? getClassificationLabel(document.document.classification)
			: null;
	const receivedDate = formatDate(document.dateEnacted);
	const downloadFilename = getDocumentFilename(document);

	const handleView = () => setIsOpen(true);

	// Generate signed URL when component mounts
	useEffect(() => {
		if (document.storagePath && document.storageBucket) {
			setIsLoadingUrl(true);
			setUrlError(false);
			const supabase = createBrowserClient();
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
			{/* View and Download Actions */}
			<div
				className="flex flex-col sm:flex-row gap-3"
				role="group"
				aria-label="Document actions"
			>
				<Button
					onClick={handleView}
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

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="w-screen max-w-screen h-dvh max-h-dvh sm:w-[96vw] sm:max-w-[96vw] sm:h-[94vh] sm:max-h-[94vh] rounded-none sm:rounded-lg overflow-hidden p-0">
					<div className="flex flex-col h-full">
						<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200 shrink-0">
							<DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
								<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#a60202]" />
								<span className="truncate">{documentNumber}</span>
							</DialogTitle>
						</DialogHeader>

						<div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
							<div className="w-full lg:w-90 lg:shrink-0 lg:border-r border-gray-200 overflow-y-auto p-4 sm:p-6">
								<div className="space-y-4">
									<div>
										<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
											Document Type
										</label>
										<div className="flex items-center gap-2 mt-1 flex-wrap">
											<span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium bg-[#fef2f2] text-[#a60202] border border-[#fecaca]">
												<FileText className="w-3 h-3" />
												{documentType}
											</span>
											<span className="text-sm text-[#a60202] font-semibold">
												{documentNumber}
											</span>
										</div>
									</div>

									<div>
										<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
											Title
										</label>
										<p className="text-sm font-medium text-gray-900 mt-1">
											{documentTitle}
										</p>
									</div>

									{classification && (
										<div className="flex items-start gap-2">
											<Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													Classification / Committee
												</label>
												<p className="text-sm text-gray-700 mt-0.5">
													{classification}
												</p>
											</div>
										</div>
									)}

									<div className="flex items-start gap-2">
										<Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
										<div>
											<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
												Date Passed/Approved
											</label>
											<p className="text-sm text-gray-700 mt-0.5">
												{receivedDate}
											</p>
										</div>
									</div>

									{document.authorNames && document.authorNames.length > 0 && (
										<div className="flex items-start gap-2">
											<User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													Author(s)
												</label>
												<p className="text-sm text-gray-700 mt-0.5">
													{document.authorNames.join(", ")}
												</p>
											</div>
										</div>
									)}

									{document.sponsorNames &&
										document.sponsorNames.length > 0 && (
											<div className="flex items-start gap-2">
												<Users className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
														Sponsor(s)
													</label>
													<p className="text-sm text-gray-700 mt-0.5">
														{document.sponsorNames.join(", ")}
													</p>
												</div>
											</div>
										)}

									<div className="border-t border-gray-200 pt-4">
										<div className="flex items-center gap-2 flex-wrap">
											<a
												href={pdfUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
											>
												<FileText className="h-3.5 w-3.5" />
												View PDF Document
											</a>
											<button
												type="button"
												onClick={() => handleDownload()}
												disabled={isDownloading}
												className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
											>
												{isDownloading ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
												) : (
													<Download className="h-3.5 w-3.5" />
												)}
												Download PDF
											</button>
										</div>
										<p className="text-xs text-gray-400 mt-2">
											File: {downloadFilename}
										</p>
									</div>
								</div>
							</div>

							<div className="hidden lg:flex flex-1 min-w-0 min-h-0 flex-col">
								{urlError || !pdfUrl || !isValidUrl ? (
									<div className="flex items-center justify-center h-full">
										<div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-center">
											<p className="text-sm text-amber-600 font-medium">
												PDF preview unavailable. Please use the actions on the
												left.
											</p>
										</div>
									</div>
								) : (
									<iframe
										src={pdfUrl}
										className="w-full h-full"
										title="Document Preview"
									/>
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
