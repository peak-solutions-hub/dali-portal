"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api.client";

interface UseDocumentFileReturn {
	fileUrl: string | null;
	fileName: string | null;
	contentType: string | null;
	isLoading: boolean;
	error: string | null;
	isPdf: boolean;
	fetchDocumentFileUrl: (documentId: string) => Promise<string | null>;
	fetchAgendaPdfUrl: (sessionId: string) => Promise<string | null>;
	downloadFile: (downloadName?: string, url?: string) => Promise<void>;
	reset: () => void;
}

/**
 * Shared hook for fetching signed file URLs and downloading documents.
 * Used by DocumentViewButton, SessionPdfView, and DownloadAgendaButton.
 */
export function useDocumentFile(): UseDocumentFileReturn {
	const [fileUrl, setFileUrl] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [contentType, setContentType] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchDocumentFileUrl = useCallback(
		async (documentId: string): Promise<string | null> => {
			setIsLoading(true);
			setError(null);

			const [err, data] = await api.sessions.getDocumentFileUrl({
				documentId,
			});

			if (err || !data) {
				setError("Unable to load document file.");
				setIsLoading(false);
				return null;
			}

			setFileUrl(data.signedUrl);
			setFileName(data.fileName);
			setContentType(data.contentType ?? null);
			setIsLoading(false);
			return data.signedUrl;
		},
		[],
	);

	const fetchAgendaPdfUrl = useCallback(
		async (sessionId: string): Promise<string | null> => {
			setIsLoading(true);
			setError(null);
			setFileUrl(null);

			try {
				const [err, data] = await api.sessions.getAgendaPdfUrl({
					id: sessionId,
				});

				if (err || !data?.signedUrl) {
					setError("Unable to load PDF.");
					return null;
				}

				setFileUrl(data.signedUrl);
				if (data.fileName) setFileName(data.fileName);
				return data.signedUrl;
			} catch {
				setError("Unable to load PDF.");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const downloadFile = useCallback(
		async (downloadName?: string, url?: string) => {
			const targetUrl = url || fileUrl;
			if (!targetUrl) return;

			try {
				const res = await fetch(targetUrl);
				const blob = await res.blob();
				const blobUrl = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = blobUrl;
				link.download = downloadName || fileName || "document.pdf";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(blobUrl);
			} catch {
				window.open(targetUrl, "_blank", "noopener,noreferrer");
			}
		},
		[fileUrl, fileName],
	);

	const reset = useCallback(() => {
		setFileUrl(null);
		setFileName(null);
		setContentType(null);
		setError(null);
	}, []);

	const isPdf =
		contentType === "application/pdf" || fileName?.endsWith(".pdf") || false;

	return {
		fileUrl,
		fileName,
		contentType,
		isLoading,
		error,
		isPdf,
		fetchDocumentFileUrl,
		fetchAgendaPdfUrl,
		downloadFile,
		reset,
	};
}
