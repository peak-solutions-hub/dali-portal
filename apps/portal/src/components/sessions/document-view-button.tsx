"use client";

import { formatDateInPHT } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	Calendar,
	Download,
	ExternalLink,
	FileText,
	Loader2,
	RefreshCw,
	Tag,
	User,
	Users,
} from "@repo/ui/lib/lucide-react";
import {
	getClassificationLabel,
	getDocumentTypeBadgeClass,
	getDocumentTypeLabel,
} from "@repo/ui/lib/session-ui";
import { useEffect, useState } from "react";
import { useSessionFile } from "@/hooks/sessions/use-session-file";

/**
 * Opens a dialog to preview and download a legislative document file.
 * Calls GET /sessions/{sessionId}/documents/{documentId}/file-url which verifies
 * the document is linked to the requested scheduled/completed session.
 */
type DocumentViewButtonProps = {
	sessionId: string;
	codeNumber?: string;
	label?: string;
	documentTitle?: string;
	documentType?: string;
	classification?: string | null;
	receivedAt?: string;
	authors?: string[];
	sponsors?: string[];
	documentId: string;
};

function formatDate(iso: string): string {
	return formatDateInPHT(iso, {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function DocumentViewButton({
	sessionId,
	documentId,
	codeNumber,
	label,
	documentTitle,
	documentType,
	classification,
	receivedAt,
	authors,
	sponsors,
}: DocumentViewButtonProps) {
	const [open, setOpen] = useState(false);
	const {
		signedUrl: fileUrl,
		fileName,
		isLoading,
		error,
		isPdf,
		fetchPublicDocumentFileUrl,
		downloadFile,
	} = useSessionFile();

	// Lock body scroll when dialog is open
	useEffect(() => {
		if (open) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = prev;
			};
		}
	}, [open]);

	const handleOpen = () => {
		setOpen(true);
		fetchPublicDocumentFileUrl(sessionId, documentId);
	};

	const handleRetry = () => {
		fetchPublicDocumentFileUrl(sessionId, documentId);
	};

	const hasDetails = documentType || documentTitle || classification;
	const viewDocumentLabel = "View PDF Document";
	const downloadDocumentLabel = "Download PDF Document";
	const previewDescription = isPdf
		? "View the full PDF document in your browser."
		: "Preview is not available for this file type. You can still open or download the PDF document.";
	const showRetry = error !== "No file available for this document.";
	const compactActionClass =
		"inline-flex w-[12rem] justify-center items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-200 hover:text-gray-950 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";
	const primaryActionClass =
		"inline-flex w-[12rem] justify-center items-center gap-1.5 text-sm px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-200 hover:text-gray-950 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";
	const secondaryActionClass =
		"inline-flex w-[12rem] justify-center items-center gap-1.5 text-sm px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-200 hover:text-gray-950 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";
	const mobileViewActionClass =
		"w-full max-w-[17rem] inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm cursor-pointer border-2 border-[#a60202] text-[#a60202] hover:bg-[#a60202] hover:text-white";
	const mobileDownloadActionClass =
		"w-full max-w-[17rem] inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm cursor-pointer border bg-[#a60202] hover:bg-[#8a0101] text-white";
	const mobileSecondaryActionClass =
		"inline-flex w-full max-w-xs justify-center items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";
	const retryButtonClass =
		"inline-flex min-w-[10rem] justify-center items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-white text-amber-700 hover:bg-amber-100 font-medium transition-colors text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";

	return (
		<>
			<button
				type="button"
				onClick={handleOpen}
				className="shrink-0 rounded-md p-1 text-gray-500 hover:text-blue-900 hover:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
				aria-label={`View PDF document ${codeNumber || label || ""}`}
				title="View PDF document"
			>
				<ExternalLink className="size-3.5 sm:size-4" />
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="w-screen max-w-screen h-dvh max-h-dvh sm:w-[96vw] sm:max-w-[96vw] sm:h-[94vh] sm:max-h-[94vh] rounded-none sm:rounded-lg overflow-hidden p-0">
					<div className="flex flex-col h-full">
						{/* Header */}
						<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200 shrink-0">
							<DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
								<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#a60202]" />
								<span className="truncate">
									{codeNumber || label || "PDF Document Preview"}
								</span>
							</DialogTitle>
						</DialogHeader>

						{/* Body */}
						<div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
							{/* Details Panel (shown when metadata is available) */}
							{hasDetails && (
								<div className="w-full lg:w-90 lg:shrink-0 lg:border-r border-gray-200 overflow-y-auto p-4 sm:p-6">
									<div className="space-y-4">
										{/* Document Type */}
										{documentType && (
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													Document Type
												</label>
												<div className="flex items-center gap-2 mt-1 flex-wrap">
													<span
														className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${getDocumentTypeBadgeClass(documentType)}`}
													>
														<FileText className="w-3 h-3" />
														{getDocumentTypeLabel(documentType)}
													</span>
													{codeNumber && (
														<span className="text-sm text-[#a60202] font-semibold">
															{codeNumber}
														</span>
													)}
												</div>
											</div>
										)}
										{!documentType && codeNumber && (
											<div>
												<span className="text-sm text-[#a60202] font-semibold">
													{codeNumber}
												</span>
											</div>
										)}

										{/* Title */}
										{documentTitle && (
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													Title
												</label>
												<p className="text-sm font-medium text-gray-900 mt-1">
													{documentTitle}
												</p>
											</div>
										)}

										{/* Classification */}
										{classification && (
											<div className="flex items-start gap-2">
												<Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
														Classification / Committee
													</label>
													<p className="text-sm text-gray-700 mt-0.5">
														{getClassificationLabel(classification)}
													</p>
												</div>
											</div>
										)}

										{/* Date Received */}
										{receivedAt && (
											<div className="flex items-start gap-2">
												<Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
														Date Received
													</label>
													<p className="text-sm text-gray-700 mt-0.5">
														{formatDate(receivedAt)}
													</p>
												</div>
											</div>
										)}

										{/* Authors */}
										{authors && authors.length > 0 && (
											<div className="flex items-start gap-2">
												<User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
														Authors
													</label>
													<div className="flex flex-wrap gap-1 mt-1">
														{authors.map((author) => (
															<Badge
																key={author}
																variant="outline"
																className="text-xs"
															>
																{author}
															</Badge>
														))}
													</div>
												</div>
											</div>
										)}

										{/* Sponsors */}
										{sponsors && sponsors.length > 0 && (
											<div className="flex items-start gap-2">
												<Users className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
												<div>
													<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
														Sponsors
													</label>
													<div className="flex flex-wrap gap-1 mt-1">
														{sponsors.map((sponsor) => (
															<Badge
																key={sponsor}
																variant="outline"
																className="text-xs"
															>
																{sponsor}
															</Badge>
														))}
													</div>
												</div>
											</div>
										)}

										{/* File Actions */}
										{fileUrl && (
											<div className="hidden lg:block border-t border-gray-200 pt-4">
												<div className="flex items-center gap-2 flex-wrap">
													<a
														href={fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className={compactActionClass}
													>
														<FileText className="h-3.5 w-3.5" />
														{viewDocumentLabel}
													</a>
													<button
														type="button"
														onClick={() => downloadFile()}
														className={compactActionClass}
													>
														<Download className="h-3.5 w-3.5" />
														{downloadDocumentLabel}
													</button>
												</div>
												{fileName && (
													<p className="text-xs text-gray-400 mt-2">
														File: {fileName}
													</p>
												)}
											</div>
										)}
									</div>
								</div>
							)}

							{/* Preview Panel — desktop only */}
							<div className="hidden lg:flex flex-1 min-w-0 min-h-0 flex-col">
								{isLoading ? (
									<div className="flex items-center justify-center h-full gap-2 text-gray-500">
										<Loader2 className="h-5 w-5 animate-spin" />
										<span className="text-sm">Loading document...</span>
									</div>
								) : error ? (
									<div className="flex items-center justify-center h-full">
										<div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-center">
											<p className="text-sm text-amber-600 font-medium">
												{error || "Unable to load document. Please try again."}
											</p>
											{showRetry && (
												<button
													type="button"
													onClick={handleRetry}
													className={`mt-3 ${retryButtonClass}`}
												>
													<RefreshCw className="h-4 w-4" aria-hidden="true" />
													Retry
												</button>
											)}
										</div>
									</div>
								) : isPdf && fileUrl ? (
									<div className="flex flex-col h-full">
										{/* Action bar (only when no details panel) */}
										{!hasDetails && (
											<div className="flex items-center justify-end gap-2 px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
												<a
													href={fileUrl}
													target="_blank"
													rel="noopener noreferrer"
													className={compactActionClass}
												>
													<FileText className="h-3.5 w-3.5" />
													{viewDocumentLabel}
												</a>
												<button
													type="button"
													onClick={() => downloadFile()}
													className={compactActionClass}
												>
													<Download className="h-3.5 w-3.5" />
													{downloadDocumentLabel}
												</button>
											</div>
										)}
										{/* PDF iframe */}
										<div className="flex-1 min-h-0">
											<iframe
												src={fileUrl}
												className="w-full h-full"
												title="Document Preview"
											/>
										</div>
									</div>
								) : fileUrl ? (
									<div className="flex flex-col items-center justify-center h-full gap-4">
										<p className="text-sm text-gray-500">
											{previewDescription}
										</p>
										<div className="flex items-center gap-2">
											<a
												href={fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className={primaryActionClass}
											>
												<FileText className="h-4 w-4" />
												{viewDocumentLabel}
											</a>
											<button
												type="button"
												onClick={() => downloadFile()}
												className={secondaryActionClass}
											>
												<Download className="h-4 w-4" />
												{downloadDocumentLabel}
											</button>
										</div>
									</div>
								) : null}
							</div>

							{/* Mobile/Tablet: always show loading/error/result state immediately */}
							<div className="flex lg:hidden flex-col items-center justify-center flex-1 p-6 space-y-4 border-t border-gray-200">
								{isLoading ? (
									<div className="flex items-center gap-2 text-gray-500">
										<Loader2
											className="h-5 w-5 animate-spin"
											aria-hidden="true"
										/>
										<span className="text-sm font-medium">
											Loading document...
										</span>
									</div>
								) : error ? (
									<div className="flex flex-col items-center gap-3 rounded-md bg-amber-50 border border-amber-200 p-4 text-center">
										<p className="text-sm text-amber-700 font-medium">
											{error || "Unable to load document. Please try again."}
										</p>
										{showRetry && (
											<button
												type="button"
												onClick={handleRetry}
												className={mobileSecondaryActionClass}
											>
												<RefreshCw className="h-4 w-4" aria-hidden="true" />
												Retry
											</button>
										)}
									</div>
								) : fileUrl ? (
									<>
										<div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
											<FileText
												className="h-8 w-8 text-[#a60202]"
												aria-hidden="true"
											/>
										</div>
										<p className="text-sm text-gray-600 text-center">
											{previewDescription}
										</p>
										<Button
											variant="outline"
											asChild
											className={mobileViewActionClass}
										>
											<a
												href={fileUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												<FileText className="h-4 w-4" aria-hidden="true" />
												{viewDocumentLabel}
											</a>
										</Button>
										<Button
											type="button"
											onClick={() => downloadFile()}
											className={mobileDownloadActionClass}
										>
											<Download className="h-4 w-4" aria-hidden="true" />
											{downloadDocumentLabel}
										</Button>
									</>
								) : (
									<p className="text-sm text-gray-500 text-center">
										No document preview is available yet.
									</p>
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
