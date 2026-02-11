"use client";

import { Button } from "@repo/ui/components/button";
import { Download, Loader2, RefreshCw } from "@repo/ui/lib/lucide-react";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

interface SessionPdfViewProps {
	agendaFilePath: string;
}

export function SessionPdfView({ agendaFilePath }: SessionPdfViewProps) {
	const [signedUrl, setSignedUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(false);

	const generateUrl = useCallback(async () => {
		setIsLoading(true);
		setError(false);

		try {
			const supabase = createSupabaseBrowserClient();
			const { data, error: urlError } = await supabase.storage
				.from("session-agendas")
				.createSignedUrl(agendaFilePath, 3600);

			if (urlError || !data?.signedUrl) {
				setError(true);
			} else {
				setSignedUrl(data.signedUrl);
			}
		} catch {
			setError(true);
		} finally {
			setIsLoading(false);
		}
	}, [agendaFilePath]);

	useEffect(() => {
		generateUrl();
	}, [generateUrl]);

	const handleDownload = () => {
		if (!signedUrl) return;
		const link = document.createElement("a");
		link.href = signedUrl;
		link.download = agendaFilePath.split("/").pop() ?? "agenda.pdf";
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

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
					onClick={generateUrl}
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
			{/* Download Button */}
			<div className="flex justify-end">
				<Button
					variant="outline"
					onClick={handleDownload}
					className="cursor-pointer border-[#a60202] text-[#a60202] hover:bg-red-50"
				>
					<Download className="h-4 w-4 mr-2" />
					Download PDF
				</Button>
			</div>

			{/* PDF iframe */}
			<iframe
				src={signedUrl}
				className="w-full h-[80vh] rounded-lg border border-gray-200"
				title="Session Agenda PDF"
			/>
		</div>
	);
}
