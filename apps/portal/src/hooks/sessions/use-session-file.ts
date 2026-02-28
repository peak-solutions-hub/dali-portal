"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api.client";

interface SessionFileResult {
	signedUrl: string;
	fileName: string;
	contentType?: string;
}

interface UseSessionFileReturn {
	signedUrl: string | null;
	fileName: string | null;
	contentType: string | null;
	isLoading: boolean;
	error: string | null;
	isPdf: boolean;
	fetchAgendaFileUrl: (sessionId: string) => Promise<string | null>;
	fetchPublicDocumentFileUrl: (
		documentId: string,
	) => Promise<SessionFileResult | null>;
	downloadFile: (url?: string, name?: string) => Promise<void>;
}

/**
 * Hook for fetching and downloading publicly accessible session files.
 *
 * Covers two public file access patterns:
 *
 * 1. Session agenda PDF
 *    Calls GET /sessions/{id}/agenda-pdf-url
 *    The session must be scheduled or completed.
 *
 * 2. Legislative document file (by documentId)
 *    Calls GET /sessions/documents/{documentId}/file-url
 *    The document must have status='approved' AND purpose='for_agenda' (both required),
 *    and must be linked to a scheduled or completed session's agenda item.
 *
 * All URL generation is delegated to the server — the server enforces all
 * visibility rules before returning a signed URL.
 *
 * Used by: DownloadAgendaButton, SessionPdfView, DocumentViewButton
 */
export function useSessionFile(): UseSessionFileReturn {
	const [signedUrl, setSignedUrl] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [contentType, setContentType] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Fetch a signed URL for the session's agenda PDF.
	 * Endpoint: GET /sessions/{id}/agenda-pdf-url
	 */
	const fetchAgendaFileUrl = useCallback(
		async (sessionId: string): Promise<string | null> => {
			setIsLoading(true);
			setError(null);
			setSignedUrl(null);

			const [err, data] = await api.sessions.getAgendaPdfUrl({ id: sessionId });

			setIsLoading(false);

			if (err || !data?.signedUrl) {
				setError("Unable to load agenda PDF.");
				return null;
			}

			setSignedUrl(data.signedUrl);
			setFileName(data.fileName);
			setContentType("application/pdf");
			return data.signedUrl;
		},
		[],
	);

	//  * Fetch a signed URL for a legislative document file by documentId.
	//  * Endpoint: GET /sessions/documents/{documentId}/file-url
	//  *
	//  * Server enforces:
	//  * - Document must be approved and for_agenda
	//  * - Document must be linked to a scheduled or completed session's agenda item
	//  */
	const fetchPublicDocumentFileUrl = useCallback(
		async (documentId: string): Promise<SessionFileResult | null> => {
			setIsLoading(true);
			setError(null);
			setSignedUrl(null);

			const [err, data] = await api.sessions.getPublicDocumentFileUrl({
				documentId,
			});

			setIsLoading(false);

			if (err || !data?.signedUrl) {
				setError("Unable to load document file.");
				return null;
			}

			setSignedUrl(data.signedUrl);
			setFileName(data.fileName);
			setContentType(data.contentType ?? null);
			return data;
		},
		[],
	);

	const downloadFile = useCallback(
		async (url?: string, name?: string) => {
			const targetUrl = url ?? signedUrl;
			if (!targetUrl) return;

			try {
				const res = await fetch(targetUrl);
				const blob = await res.blob();
				const blobUrl = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = blobUrl;
				link.download = name ?? fileName ?? "document.pdf";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(blobUrl);
			} catch {
				window.open(targetUrl, "_blank", "noopener,noreferrer");
			}
		},
		[signedUrl, fileName],
	);

	const isPdf =
		contentType === "application/pdf" || fileName?.endsWith(".pdf") || false;

	return {
		signedUrl,
		fileName,
		contentType,
		isLoading,
		error,
		isPdf,
		fetchAgendaFileUrl,
		fetchPublicDocumentFileUrl,
		downloadFile,
	};
}
