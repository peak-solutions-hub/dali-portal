"use client";

import type { SessionManagementDocument as Document } from "@repo/shared";
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
	FileText,
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

interface DocumentViewerDialogProps {
	document: Document | null;
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
	document,
	open,
	onOpenChange,
}: DocumentViewerDialogProps) {
	const [fileUrl, setFileUrl] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [contentType, setContentType] = useState<string | null>(null);
	const [isLoadingFile, setIsLoadingFile] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	const fetchFileUrl = useCallback(async (docId: string) => {
		setIsLoadingFile(true);
		setFileError(null);
		setFileUrl(null);
		setFileName(null);
		setContentType(null);

		const [err, data] = await api.sessions.getDocumentFileUrl({
			documentId: docId,
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
	}, []);

	// Fetch file URL when dialog opens
	useEffect(() => {
		if (open && document) {
			fetchFileUrl(document.id);
		}
	}, [open, document, fetchFileUrl]);

	if (!document) return null;

	const isPdf = contentType === "application/pdf" || fileName?.endsWith(".pdf");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-screen max-w-screen h-dvh max-h-dvh sm:w-[96vw] sm:max-w-[96vw] sm:h-[94vh] sm:max-h-[94vh] rounded-none sm:rounded-lg overflow-hidden p-0">
				<div className="flex flex-col h-full">
					{/* Header */}
					<DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 shrink-0">
						<DialogTitle className="flex items-center gap-2 text-lg">
							<FileText className="h-5 w-5 text-[#a60202]" />
							Document Details
						</DialogTitle>
					</DialogHeader>

					{/* Body: side-by-side layout */}
					<div className="flex flex-1 min-h-0 overflow-hidden">
						{/* Left: Document Details */}
						<div className="w-full sm:w-105 sm:shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 overflow-y-auto p-4 sm:p-6">
							<div className="space-y-4">
								{/* Type Badge and Code Number */}
								<div className="flex items-center gap-2 flex-wrap">
									<span
										className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${getDocumentTypeBadgeClass(document.type)}`}
									>
										<FileText className="w-3 h-3" />
										{document.type}
									</span>
									<span className="text-sm text-[#a60202] font-semibold">
										{document.number}
									</span>
								</div>

								{/* Title */}
								<div>
									<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
										Title
									</label>
									<p className="text-sm font-medium text-gray-900 mt-1">
										{document.title}
									</p>
								</div>

								{/* Classification */}
								<div className="flex items-start gap-2">
									<Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
									<div>
										<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
											Classification / Committee
										</label>
										<p className="text-sm text-gray-700 mt-0.5">
											{getClassificationLabel(document.classification)}
										</p>
									</div>
								</div>

								{/* Date Received */}
								<div className="flex items-start gap-2">
									<Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
									<div>
										<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
											Date Received
										</label>
										<p className="text-sm text-gray-700 mt-0.5">
											{formatDate(document.receivedAt)}
										</p>
									</div>
								</div>

								{/* Authors */}
								{document.authors.length > 0 && (
									<div className="flex items-start gap-2">
										<User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
										<div>
											<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
												Authors
											</label>
											<div className="flex flex-wrap gap-1 mt-1">
												{document.authors.map((author) => (
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
								{document.sponsors.length > 0 && (
									<div className="flex items-start gap-2">
										<Users className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
										<div>
											<label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
												Sponsors
											</label>
											<div className="flex flex-wrap gap-1 mt-1">
												{document.sponsors.map((sponsor) => (
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

								{/* Document File Actions */}
								{fileUrl && (
									<div className="border-t border-gray-200 pt-4">
										<div className="space-y-3">
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
												<p className="text-xs text-gray-400">
													File: {fileName}
												</p>
											)}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Right: PDF Preview Panel */}
						<div className="flex-1 min-w-0 bg-gray-100 flex flex-col">
							{isLoadingFile ? (
								<div className="flex items-center justify-center h-full gap-2 text-gray-500">
									<Loader2 className="h-5 w-5 animate-spin" />
									<span className="text-sm">Loading document...</span>
								</div>
							) : fileError ? (
								<div className="flex items-center justify-center h-full">
									<div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-center">
										<p className="text-sm text-amber-600 font-medium">
											{fileError}
										</p>
									</div>
								</div>
							) : isPdf && fileUrl ? (
								<>
									<div className="px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
										<p className="text-xs font-medium text-gray-500">
											Document Preview
										</p>
									</div>
									<div className="flex-1 min-h-0">
										<iframe
											src={fileUrl}
											className="w-full h-full"
											title="Document Preview"
										/>
									</div>
								</>
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
	);
}
