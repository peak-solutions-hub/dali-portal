"use client";

import type { SessionManagementSession as Session } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { useSupabaseUpload } from "@repo/ui/hooks";
import {
	CheckCircle2,
	ExternalLink,
	FileText,
	Loader2,
	Trash2,
	Upload,
} from "@repo/ui/lib/lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB

interface AgendaPdfUploadProps {
	selectedSession: Session;
	onRemoveAgendaPdf?: () => void;
	isRemovingPdf?: boolean;
	/** Called after a successful upload + DB save so the parent can invalidate */
	onUploadSuccess?: () => Promise<void>;
}

export function AgendaPdfUpload({
	selectedSession,
	onRemoveAgendaPdf,
	isRemovingPdf = false,
	onUploadSuccess,
}: AgendaPdfUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [isLoadingViewUrl, setIsLoadingViewUrl] = useState(false);

	/** Fetch a signed read URL and open the PDF in a new tab */
	const handleViewPdf = async () => {
		if (!selectedSession.agendaFilePath) return;
		setIsLoadingViewUrl(true);
		try {
			const [err, data] = await api.sessions.getAgendaPdfUrl({
				id: selectedSession.id,
			});
			if (err || !data?.signedUrl) {
				toast.error("Could not open PDF. Please try again.");
				return;
			}
			window.open(data.signedUrl, "_blank", "noopener,noreferrer");
		} catch {
			toast.error("Could not open PDF. Please try again.");
		} finally {
			setIsLoadingViewUrl(false);
		}
	};

	// ── useSupabaseUpload wired to the backend signed-URL endpoint ──────────
	// getSignedUploadUrls: fetches a signed URL from our backend, which
	// also generates the correct storage path inside the "agendas" bucket.
	const { files, getRootProps, getInputProps, isDragActive, reset } =
		useSupabaseUpload({
			path: `session-${selectedSession.id}`,
			allowedMimeTypes: ["application/pdf"],
			maxFiles: 1,
			maxFileSize: MAX_PDF_SIZE,
			// Signed-URL mode: backend controls the bucket path. No direct
			// Supabase client credentials needed on the frontend.
			getSignedUploadUrls: async (_folder, fileNames) => {
				const [err, data] = await api.sessions.getAgendaUploadUrl({
					id: selectedSession.id,
					fileName: fileNames[0] ?? "",
				});
				if (err || !data) {
					toast.error("Could not get upload URL. Please try again.");
					throw new Error("Failed to get upload URL");
				}
				return [
					{
						fileName: fileNames[0] ?? "",
						path: data.path,
						signedUrl: data.signedUrl,
						token: data.token ?? "",
					},
				];
			},
		});

	// Derived state from the dropzone files array
	const pickedFile = files.find((f) => f.errors.length === 0) ?? null;
	const fileError =
		files[0]?.errors[0]?.message ??
		(pickedFile && pickedFile.size > MAX_PDF_SIZE
			? `File exceeds 5 MB limit (${(pickedFile.size / 1024 / 1024).toFixed(1)} MB)`
			: null);

	// ── Handle upload: call useSupabaseUpload's onUpload then saveAgendaPdf ─
	const handleUpload = async () => {
		if (!pickedFile) return;
		setIsUploading(true);
		try {
			// 1. Get signed URL + upload to Supabase storage
			const [err, urlData] = await api.sessions.getAgendaUploadUrl({
				id: selectedSession.id,
				fileName: pickedFile.name,
			});

			if (err || !urlData) {
				toast.error("Failed to get upload URL. Please try again.");
				return;
			}

			// 2. PUT the file to the signed URL
			const uploadRes = await fetch(urlData.signedUrl, {
				method: "PUT",
				headers: {
					"Content-Type": "application/pdf",
				},
				body: pickedFile,
			});

			if (!uploadRes.ok) {
				toast.error(`Upload failed (${uploadRes.status}). Please try again.`);
				return;
			}

			// 3. Persist the path on the session record
			const [saveErr] = await api.sessions.saveAgendaPdf({
				id: selectedSession.id,
				filePath: urlData.path,
				fileName: pickedFile.name,
			});

			if (saveErr) {
				toast.error("File uploaded but failed to save. Please try again.");
				return;
			}

			toast.success("Agenda PDF uploaded successfully.");
			reset();
			await onUploadSuccess?.();
		} catch (err) {
			toast.error("An unexpected error occurred. Please try again.");
			console.error("Agenda PDF upload error:", err);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="rounded-lg border border-blue-200 bg-blue-50/60 p-2.5">
			<label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-1.5">
				<FileText className="h-4 w-4 text-blue-600" />
				Agenda PDF (Public)
			</label>

			{/* ── Already has an uploaded PDF ── */}
			{selectedSession.agendaFilePath ? (
				<div className="flex items-center gap-2 p-2.5 bg-white border border-green-200 rounded-lg">
					<CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-green-800 truncate">
							Agenda PDF uploaded
						</p>
						<p className="text-xs text-green-600 truncate">
							{selectedSession.agendaFilePath.split("/").pop()}
						</p>
					</div>
					{/* View in new tab */}
					<Button
						variant="ghost"
						size="sm"
						className="cursor-pointer text-green-600 hover:text-blue-600 hover:bg-blue-50"
						onClick={handleViewPdf}
						disabled={isLoadingViewUrl || isRemovingPdf}
						title="View PDF"
					>
						{isLoadingViewUrl ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<ExternalLink className="h-4 w-4" />
						)}
					</Button>
					{/* Remove */}
					<Button
						variant="ghost"
						size="sm"
						className="cursor-pointer text-green-600 hover:text-red-600 hover:bg-red-50"
						onClick={onRemoveAgendaPdf}
						disabled={isRemovingPdf || isLoadingViewUrl}
						title="Remove PDF"
					>
						{isRemovingPdf ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Trash2 className="h-4 w-4" />
						)}
					</Button>
				</div>
			) : isUploading ? (
				/* ── Uploading in progress ── */
				<div className="flex items-center justify-center gap-2 p-3 bg-white border border-blue-200 rounded-lg">
					<Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
					<span className="text-sm text-blue-700">Uploading PDF...</span>
				</div>
			) : pickedFile ? (
				/* ── File picked, waiting for confirmation ── */
				<div className="space-y-2">
					<div className="flex items-center gap-2 p-2.5 bg-white border border-blue-200 rounded-lg">
						<FileText className="h-4 w-4 text-blue-600 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-blue-800 truncate">
								{pickedFile.name}
							</p>
							<p className="text-xs text-blue-600">
								{(pickedFile.size / 1024 / 1024).toFixed(2)} MB
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="cursor-pointer text-blue-600 hover:text-red-600 hover:bg-red-50"
							onClick={reset}
						>
							✕
						</Button>
					</div>
					<Button
						size="sm"
						className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
						onClick={handleUpload}
					>
						<Upload className="h-4 w-4 mr-2" />
						Confirm Upload
					</Button>
				</div>
			) : (
				/* ── Dropzone / pick file ── */
				<div
					{...getRootProps()}
					className={`cursor-pointer w-full border border-dashed rounded-lg bg-white flex items-center justify-center px-3 py-2.5 text-sm transition-colors ${
						isDragActive
							? "border-blue-400 bg-blue-50 text-blue-700"
							: fileError
								? "border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500"
								: "border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
					}`}
				>
					<input {...getInputProps()} />
					<Upload className="h-4 w-4 mr-2 shrink-0" />
					{isDragActive ? "Drop PDF here…" : "Click or drag to upload PDF"}
				</div>
			)}

			{fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
			<p className="text-xs text-blue-600/70 mt-1.5">
				Publicly visible on the portal. Max 5 MB, PDF only.
			</p>
		</div>
	);
}
