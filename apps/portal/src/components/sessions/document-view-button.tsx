"use client";

import { Badge } from "@repo/ui/components/badge";
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
	Eye,
	FileText,
	Info,
	Loader2,
	Tag,
	User,
	Users,
} from "@repo/ui/lib/lucide-react";
import {
	getClassificationLabel,
	getDocumentTypeBadgeClass,
} from "@repo/ui/lib/session-ui";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api.client";

interface DocumentViewButtonProps {
	documentId: string;
	codeNumber?: string;
	label?: string;
	/** Optional document metadata for the details panel */
	documentTitle?: string;
	documentType?: string;
	classification?: string | null;
	receivedAt?: string;
	authors?: string[];
	sponsors?: string[];
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function DocumentViewButton({
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
	const [fileUrl, setFileUrl] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [contentType, setContentType] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchFileUrl = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		const [err, data] = await api.sessions.getDocumentFileUrl({
			documentId,
		});

		if (err || !data) {
			setError("Unable to load document file.");
			setIsLoading(false);
			return;
		}

		setFileUrl(data.signedUrl);
		setFileName(data.fileName);
		setContentType(data.contentType ?? null);
		setIsLoading(false);
	}, [documentId]);

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
		fetchFileUrl();
	};

	const isPdf = contentType === "application/pdf" || fileName?.endsWith(".pdf");
	const hasDetails = documentType || documentTitle || classification;
	// Mobile toggle: "details" or "preview"
	const [mobileView, setMobileView] = useState<"details" | "preview">(
		"preview",
	);

	return (
		<>
			<button
				type="button"
				onClick={handleOpen}
				className="shrink-0 text-gray-400 hover:text-[#a60202] transition-colors cursor-pointer"
				aria-label={`View document ${codeNumber || label || ""}`}
				title="View document"
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
									{codeNumber || label || "Document Preview"}
								</span>
							</DialogTitle>
						</DialogHeader>

						{/* Body */}
						<div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
							{/* Mobile toggle buttons */}
							{hasDetails && isPdf && fileUrl && (
								<div className="flex sm:hidden border-b border-gray-200 shrink-0">
									<button
										type="button"
										onClick={() => setMobileView("preview")}
										className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${mobileView === "preview" ? "bg-[#a60202] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
									>
										<Eye className="h-3.5 w-3.5" />
										Document
									</button>
									<button
										type="button"
										onClick={() => setMobileView("details")}
										className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${mobileView === "details" ? "bg-[#a60202] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
									>
										<Info className="h-3.5 w-3.5" />
										Details
									</button>
								</div>
							)}

							{/* Details Panel (shown when metadata is available) */}
							{hasDetails && (
								<div
									className={`w-full sm:w-90 sm:shrink-0 sm:border-r border-gray-200 overflow-y-auto p-4 sm:p-6 ${hasDetails && isPdf && fileUrl ? (mobileView === "details" ? "block" : "hidden sm:block") : ""}`}
								>
									<div className="space-y-4">
										{/* Type Badge and Code Number */}
										{(documentType || codeNumber) && (
											<div className="flex items-center gap-2 flex-wrap">
												{documentType && (
													<span
														className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${getDocumentTypeBadgeClass(documentType)}`}
													>
														<FileText className="w-3 h-3" />
														{documentType}
													</span>
												)}
												{codeNumber && (
													<span className="text-sm text-[#a60202] font-semibold">
														{codeNumber}
													</span>
												)}
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
											<div className="border-t border-gray-200 pt-4">
												<div className="flex items-center gap-2 flex-wrap">
													<a
														href={fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
													>
														<ExternalLink className="h-3.5 w-3.5" />
														Open in New Tab
													</a>
													<a
														href={fileUrl}
														download={fileName || "document"}
														className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
													>
														<Download className="h-3.5 w-3.5" />
														Download
													</a>
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

							{/* Preview Panel */}
							<div
								className={`flex-1 min-w-0 min-h-0 flex flex-col ${hasDetails && isPdf && fileUrl && mobileView === "details" ? "hidden sm:flex" : ""}`}
							>
								{isLoading ? (
									<div className="flex items-center justify-center h-full gap-2 text-gray-500">
										<Loader2 className="h-5 w-5 animate-spin" />
										<span className="text-sm">Loading document...</span>
									</div>
								) : error ? (
									<div className="flex items-center justify-center h-full">
										<div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-center">
											<p className="text-sm text-amber-600 font-medium">
												{error}
											</p>
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
													className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium transition-colors"
												>
													<ExternalLink className="h-3.5 w-3.5" />
													Open in New Tab
												</a>
												<a
													href={fileUrl}
													download={fileName || "document"}
													className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium transition-colors"
												>
													<Download className="h-3.5 w-3.5" />
													Download
												</a>
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
											Preview not available for this file type.
										</p>
										<div className="flex items-center gap-2">
											<a
												href={fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-[#a60202] text-white hover:bg-[#8a0202] font-medium transition-colors"
											>
												<ExternalLink className="h-4 w-4" />
												Open File
											</a>
											<a
												href={fileUrl}
												download={fileName || "document"}
												className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
											>
												<Download className="h-4 w-4" />
												Download
											</a>
										</div>
									</div>
								) : null}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
