"use client";

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
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api.client";

interface DocumentViewerMetadata {
	title?: string;
	type?: string;
	number?: string;
	classification?: string | null;
	receivedAt?: string;
	authors?: string[];
	sponsors?: string[];
}

interface DocumentViewerDialogProps {
	documentId: string | null;
	sessionId?: string | null;
	document?: DocumentViewerMetadata | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function DocumentViewerDialog({
	documentId,
	sessionId,
	document,
	open,
	onOpenChange,
}: DocumentViewerDialogProps) {
	const [fileUrl, setFileUrl] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [contentType, setContentType] = useState<string | null>(null);
	const [isLoadingFile, setIsLoadingFile] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	const fetchFileUrl = useCallback(
		async (docId: string) => {
			setIsLoadingFile(true);
			setFileError(null);
			setFileUrl(null);
			setFileName(null);
			setContentType(null);

			const [err, data] = await api.sessions.getDocumentFileUrl({
				documentId: docId,
				...(sessionId ? { sessionId } : {}),
			});

			if (err || !data) {
				setFileError("No file available for this document.");
				setIsLoadingFile(false);
				return;
			}

			setFileUrl(data.signedUrl);
			setFileName(data.fileName);
			setContentType(data.contentType ?? null);
			setIsLoadingFile(false);
		},
		[sessionId],
	);

	useEffect(() => {
		if (open && documentId) {
			fetchFileUrl(documentId);
		}
	}, [open, documentId, fetchFileUrl]);

	if (!documentId) return null;

	const documentTitle = document?.title ?? "Document metadata unavailable";
	const documentType = document?.type;
	const documentNumber = document?.number;
	const documentClassification = document?.classification ?? null;
	const documentReceivedAt = document?.receivedAt;
	const documentAuthors = document?.authors ?? [];
	const documentSponsors = document?.sponsors ?? [];

	const isPdf = contentType === "application/pdf" || fileName?.endsWith(".pdf");
	const hasDetails =
		Boolean(documentType) ||
		Boolean(documentTitle) ||
		Boolean(documentClassification);
	const viewDocumentLabel = "View PDF Document";
	const downloadDocumentLabel = "Download PDF Document";
	const previewDescription = isPdf
		? "View the full PDF document in your browser."
		: "Preview is not available for this file type. You can still open or download the PDF document.";
	const showRetry = fileError !== "No file available for this document.";

	const compactActionClass =
		"inline-flex w-[12rem] justify-center items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-200 hover:text-gray-950 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";
	const primaryActionClass =
		"inline-flex w-[12rem] justify-center items-center gap-1.5 text-sm px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-200 hover:text-gray-950 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";
	const secondaryActionClass =
		"inline-flex w-[12rem] justify-center items-center gap-1.5 text-sm px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 hover:bg-gray-200 hover:text-gray-950 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";
	const mobileViewActionClass =
		"w-full max-w-[17rem] inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm cursor-pointer border-2 border-[#a60202] text-[#a60202] hover:bg-[#a60202] hover:text-white";
	const mobileDownloadActionClass =
		"w-full max-w-[17rem] inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm cursor-pointer border bg-[#a60202] hover:bg-[#8a0101] text-white";
	const retryButtonClass =
		"inline-flex min-w-[10rem] justify-center items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-white text-amber-700 hover:bg-amber-100 font-medium transition-colors text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";
	const mobileRetryButtonClass =
		"inline-flex w-full max-w-xs justify-center items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-white text-amber-700 hover:bg-amber-100 font-medium transition-colors text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2";

	const handleDownload = async () => {
		if (!fileUrl) return;
		try {
			const res = await fetch(fileUrl);
			const blob = await res.blob();
			const blobUrl = URL.createObjectURL(blob);
			const link = globalThis.document.createElement("a");
			link.href = blobUrl;
			link.download = fileName || "document.pdf";
			globalThis.document.body.appendChild(link);
			link.click();
			globalThis.document.body.removeChild(link);
			URL.revokeObjectURL(blobUrl);
		} catch {
			window.open(fileUrl, "_blank", "noopener,noreferrer");
		}
	};

	const handleRetry = () => {
		if (!documentId) return;
		fetchFileUrl(documentId);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-screen max-w-screen h-dvh max-h-dvh sm:w-[96vw] sm:max-w-[96vw] sm:h-[94vh] sm:max-h-[94vh] rounded-none sm:rounded-lg overflow-hidden p-0">
				<div className="flex flex-col h-full">
					<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200 shrink-0">
						<DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
							<FileText
								className="h-4 w-4 sm:h-5 sm:w-5 text-[#a60202]"
								aria-hidden="true"
							/>
							<span className="truncate">
								{documentNumber ?? "Document Details"}
							</span>
						</DialogTitle>
					</DialogHeader>

					<div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
						{hasDetails && (
							<div className="w-full lg:w-90 lg:shrink-0 lg:border-r border-gray-200 overflow-y-auto p-4 sm:p-6">
								<div className="space-y-4">
									{documentType && (
										<div>
											<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
												Document Type
											</label>
											<div className="flex items-center gap-2 mt-1 flex-wrap">
												<span
													className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${getDocumentTypeBadgeClass(documentType)}`}
												>
													<FileText className="w-3 h-3" aria-hidden="true" />
													{getDocumentTypeLabel(documentType)}
												</span>
												{documentNumber && (
													<span className="text-sm text-[#a60202] font-semibold">
														{documentNumber}
													</span>
												)}
											</div>
										</div>
									)}

									{!documentType && documentNumber && (
										<div>
											<span className="text-sm text-[#a60202] font-semibold">
												{documentNumber}
											</span>
										</div>
									)}

									<div>
										<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
											Title
										</label>
										<p className="text-sm font-medium text-gray-900 mt-1">
											{documentTitle}
										</p>
									</div>

									{documentClassification && (
										<div className="flex items-start gap-2">
											<Tag
												className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"
												aria-hidden="true"
											/>
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													Classification / Committee
												</label>
												<p className="text-sm text-gray-700 mt-0.5">
													{getClassificationLabel(documentClassification)}
												</p>
											</div>
										</div>
									)}

									{documentReceivedAt && (
										<div className="flex items-start gap-2">
											<Calendar
												className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"
												aria-hidden="true"
											/>
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													Date Received
												</label>
												<p className="text-sm text-gray-700 mt-0.5">
													{formatDate(documentReceivedAt)}
												</p>
											</div>
										</div>
									)}

									{documentAuthors.length > 0 && (
										<div className="flex items-start gap-2">
											<User
												className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"
												aria-hidden="true"
											/>
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													Authors
												</label>
												<div className="flex flex-wrap gap-1 mt-1">
													{documentAuthors.map((author) => (
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

									{documentSponsors.length > 0 && (
										<div className="flex items-start gap-2">
											<Users
												className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"
												aria-hidden="true"
											/>
											<div>
												<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
													Sponsors
												</label>
												<div className="flex flex-wrap gap-1 mt-1">
													{documentSponsors.map((sponsor) => (
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

									{fileUrl && (
										<div className="hidden lg:block border-t border-gray-200 pt-4">
											<div className="flex items-center gap-2 flex-wrap">
												<a
													href={fileUrl}
													target="_blank"
													rel="noopener noreferrer"
													className={compactActionClass}
												>
													<FileText
														className="h-3.5 w-3.5"
														aria-hidden="true"
													/>
													{viewDocumentLabel}
												</a>
												<button
													type="button"
													onClick={handleDownload}
													className={compactActionClass}
												>
													<Download
														className="h-3.5 w-3.5"
														aria-hidden="true"
													/>
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

						<div className="hidden lg:flex flex-1 min-w-0 min-h-0 flex-col">
							{isLoadingFile ? (
								<div className="flex items-center justify-center h-full gap-2 text-gray-500">
									<Loader2
										className="h-5 w-5 animate-spin"
										aria-hidden="true"
									/>
									<span className="text-sm">Loading document...</span>
								</div>
							) : fileError ? (
								<div
									className="flex items-center justify-center h-full"
									role="alert"
									aria-live="assertive"
								>
									<div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-center">
										<p className="text-sm text-amber-600 font-medium">
											{fileError}
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
									{!hasDetails && (
										<div className="flex items-center justify-end gap-2 px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
											<a
												href={fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className={compactActionClass}
											>
												<FileText className="h-3.5 w-3.5" aria-hidden="true" />
												{viewDocumentLabel}
											</a>
											<button
												type="button"
												onClick={handleDownload}
												className={compactActionClass}
											>
												<Download className="h-3.5 w-3.5" aria-hidden="true" />
												{downloadDocumentLabel}
											</button>
										</div>
									)}
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
									<p className="text-sm text-gray-500">{previewDescription}</p>
									<div className="flex items-center gap-2">
										<a
											href={fileUrl}
											target="_blank"
											rel="noopener noreferrer"
											className={primaryActionClass}
										>
											<FileText className="h-4 w-4" aria-hidden="true" />
											{viewDocumentLabel}
										</a>
										<button
											type="button"
											onClick={handleDownload}
											className={secondaryActionClass}
										>
											<Download className="h-4 w-4" aria-hidden="true" />
											{downloadDocumentLabel}
										</button>
									</div>
								</div>
							) : null}
						</div>

						<div className="flex lg:hidden flex-col items-center justify-center flex-1 p-6 space-y-4 border-t border-gray-200">
							{isLoadingFile ? (
								<div className="flex items-center gap-2 text-gray-500">
									<Loader2
										className="h-5 w-5 animate-spin"
										aria-hidden="true"
									/>
									<span className="text-sm font-medium">
										Loading document...
									</span>
								</div>
							) : fileError ? (
								<div className="flex flex-col items-center gap-3 rounded-md bg-amber-50 border border-amber-200 p-4 text-center">
									<p className="text-sm text-amber-700 font-medium">
										{fileError}
									</p>
									{showRetry && (
										<button
											type="button"
											onClick={handleRetry}
											className={mobileRetryButtonClass}
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
										<a href={fileUrl} target="_blank" rel="noopener noreferrer">
											<FileText className="h-4 w-4" aria-hidden="true" />
											{viewDocumentLabel}
										</a>
									</Button>
									<Button
										type="button"
										onClick={handleDownload}
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
	);
}
