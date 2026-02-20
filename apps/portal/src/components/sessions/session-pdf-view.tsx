"use client";

import { Button } from "@repo/ui/components/button";
import {
	Download,
	FileText,
	Loader2,
	RefreshCw,
} from "@repo/ui/lib/lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDocumentFile } from "@/hooks/sessions/use-document-file";

interface SessionPdfViewProps {
	sessionId: string;
	agendaFilePath: string;
}

export function SessionPdfView({
	sessionId,
	agendaFilePath,
}: SessionPdfViewProps) {
	const {
		isLoading,
		fileUrl: signedUrl,
		error,
		fetchAgendaPdfUrl,
		downloadFile,
	} = useDocumentFile();

	const [isDownloading, setIsDownloading] = useState(false);

	useEffect(() => {
		fetchAgendaPdfUrl(sessionId);
	}, [sessionId, fetchAgendaPdfUrl]);

	const handleDownload = useCallback(async () => {
		if (!agendaFilePath || isDownloading) return;
		setIsDownloading(true);
		try {
			// Reuse already-fetched signedUrl if available, otherwise fetch
			const url = signedUrl ?? (await fetchAgendaPdfUrl(sessionId));
			if (url) await downloadFile(undefined, url);
		} finally {
			setIsDownloading(false);
		}
	}, [
		sessionId,
		agendaFilePath,
		signedUrl,
		isDownloading,
		fetchAgendaPdfUrl,
		downloadFile,
	]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-[#a60202]" />
			</div>
		);
	}

	if (error || !signedUrl) {
		return (
			<div className="flex flex-col items-center justify-center py-20 space-y-4">
				<p className="text-sm text-gray-600">
					Unable to load PDF. Please try again.
				</p>
				<Button
					variant="outline"
					onClick={() => fetchAgendaPdfUrl(sessionId)}
					className="cursor-pointer"
				>
					<RefreshCw className="h-4 w-4 mr-2" />
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col items-center justify-center py-12 px-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
				<div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
					<FileText className="h-8 w-8 text-[#a60202]" />
				</div>
				<p className="text-sm text-gray-600 text-center">
					View the full agenda document in your browser.
				</p>

				<div className="flex flex-col w-56 gap-3">
					<Button
						variant="outline"
						asChild
						className="border-2 border-[#a60202] text-[#a60202] hover:bg-[#a60202] hover:text-white px-6 py-5 w-full"
					>
						<a href={signedUrl} target="_blank" rel="noopener noreferrer">
							<FileText className="h-5 w-5 mr-2" />
							View PDF Document
						</a>
					</Button>

					<Button
						onClick={handleDownload}
						disabled={!agendaFilePath || isDownloading}
						className="border bg-[#a60202] hover:bg-[#8a0101] cursor-pointer text-white px-6 py-5 w-full"
					>
						{isDownloading ? (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						) : (
							<Download className="h-4 w-4 mr-2" />
						)}
						Download Agenda PDF
					</Button>
				</div>
			</div>
		</div>
	);
}
