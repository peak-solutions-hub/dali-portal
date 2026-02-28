"use client";

import { Button } from "@repo/ui/components/button";
import { Download, Loader2 } from "@repo/ui/lib/lucide-react";
import { useCallback } from "react";
import { useSessionFile } from "@/hooks";

interface DownloadAgendaButtonProps {
	sessionId: string;
	agendaFilePath: string | null;
}

export function DownloadAgendaButton({
	sessionId,
	agendaFilePath,
}: DownloadAgendaButtonProps) {
	const {
		isLoading: isDownloading,
		fetchAgendaFileUrl,
		downloadFile,
	} = useSessionFile();

	const handleDownload = useCallback(async () => {
		if (!agendaFilePath) return;
		const url = await fetchAgendaFileUrl(sessionId);
		if (url) await downloadFile(url);
	}, [sessionId, agendaFilePath, fetchAgendaFileUrl, downloadFile]);

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={!agendaFilePath || isDownloading}
			onClick={handleDownload}
			className={`inline-flex items-center gap-2 cursor-pointer ${
				agendaFilePath
					? "border-[#a60202] text-[#a60202] hover:bg-red-50"
					: "border-gray-300 text-gray-400 cursor-not-allowed"
			}`}
			aria-label={
				agendaFilePath ? "Download session agenda PDF" : "No PDF available"
			}
		>
			{isDownloading ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<Download className="h-4 w-4" />
			)}
			Download Agenda PDF
		</Button>
	);
}
