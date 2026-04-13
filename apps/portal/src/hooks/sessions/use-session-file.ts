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
		sessionId: string,
		documentId: string,
	) => Promise<SessionFileResult | null>;
	downloadFile: (url?: string, name?: string) => Promise<void>;
}

const NO_FILE_AVAILABLE_MESSAGE = "No file available for this document.";

function isNoFileError(err: unknown): boolean {
	if (typeof err !== "object" || err === null) {
		return false;
	}

	const code =
		"code" in err && typeof err.code === "string" ? err.code : undefined;
	const status =
		"status" in err && typeof err.status === "number" ? err.status : undefined;
	const message =
		"message" in err && typeof err.message === "string"
			? err.message.toLowerCase()
			: "";

	return (
		status === 404 ||
		code === "NOT_FOUND" ||
		code === "GENERAL.NOT_FOUND" ||
		message.includes("not found")
	);
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
 *    Calls GET /sessions/{sessionId}/documents/{documentId}/file-url
 *    The document must be linked to the requested scheduled or completed session's agenda item.
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

	/**
	 * Fetch a signed URL for a legislative document file by documentId.
	 * Endpoint: GET /sessions/{sessionId}/documents/{documentId}/file-url
	 *
	 * Server enforces:
	 * - Document must be linked to the requested scheduled/completed session's agenda item
	 */
	const fetchPublicDocumentFileUrl = useCallback(
		async (
			sessionId: string,
			documentId: string,
		): Promise<SessionFileResult | null> => {
			setIsLoading(true);
			setError(null);
			setSignedUrl(null);

			const [err, data] = await api.sessions.getPublicDocumentFileUrl({
				sessionId,
				documentId,
			});

			setIsLoading(false);

			if (err) {
				if (isNoFileError(err)) {
					setError(NO_FILE_AVAILABLE_MESSAGE);
				} else {
					setError("Unable to load document file.");
				}
				return null;
			}

			if (!data?.signedUrl) {
				setError(NO_FILE_AVAILABLE_MESSAGE);
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
