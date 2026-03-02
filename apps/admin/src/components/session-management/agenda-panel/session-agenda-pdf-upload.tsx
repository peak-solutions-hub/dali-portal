"use client";

import { isDefinedError } from "@orpc/client";
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

interface SessionAgendaPdfUploadProps {
	selectedSession: Session;
	onRemoveAgendaPdf?: () => void;
	isRemovingPdf?: boolean;
	onUploadSuccess?: () => Promise<void>;
}

export function SessionAgendaPdfUpload({
	selectedSession,
	onRemoveAgendaPdf,
	isRemovingPdf = false,
	onUploadSuccess,
}: SessionAgendaPdfUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [isLoadingViewUrl, setIsLoadingViewUrl] = useState(false);

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

	const { files, getRootProps, getInputProps, isDragActive, reset } =
		useSupabaseUpload({
			path: `session-${selectedSession.id}`,
			allowedMimeTypes: ["application/pdf"],
			maxFiles: 1,
			maxFileSize: MAX_PDF_SIZE,
			getSignedUploadUrls: async (_folder, fileNames) => {
				const [err, data] = await api.sessions.getAgendaUploadUrl({
					id: selectedSession.id,
					fileName: fileNames[0] ?? "",
				});
				if (err || !data) {
					toast.error(
						isDefinedError(err)
							? err.message
							: "Could not get upload URL. Please try again.",
					);
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

	const pickedFile = files.find((f) => f.errors.length === 0) ?? null;
	// Clear the error as soon as a valid file is selected.
	const fileError = pickedFile ? null : (files[0]?.errors[0]?.message ?? null);

	const handleUpload = async () => {
		if (!pickedFile) return;
		setIsUploading(true);
		try {
			const [err, urlData] = await api.sessions.getAgendaUploadUrl({
				id: selectedSession.id,
				fileName: pickedFile.name,
			});
			if (err || !urlData) {
				toast.error(
					isDefinedError(err)
						? err.message
						: "Failed to get upload URL. Please try again.",
				);
				return;
			}
			const uploadRes = await fetch(urlData.signedUrl, {
				method: "PUT",
				headers: { "Content-Type": "application/pdf" },
				body: pickedFile,
			});
			if (!uploadRes.ok) {
				toast.error(`Upload failed (${uploadRes.status}). Please try again.`);
				return;
			}
			const [saveErr] = await api.sessions.saveAgendaPdf({
				id: selectedSession.id,
				filePath: urlData.path,
				fileName: pickedFile.name,
			});
			if (saveErr) {
				toast.error(
					isDefinedError(saveErr)
						? saveErr.message
						: "File uploaded but failed to save. Please try again.",
				);
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

	// ── Content only — no outer wrapper. The parent (ScheduledActionBar)
	// owns the blue container so there's no double border/background.
	return (
		<div className="space-y-1.5">
			{selectedSession.agendaFilePath ? (
				/* ── Uploaded ── */
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
				/* ── Uploading ── */
				<div className="flex items-center justify-center gap-2 p-3 bg-white border border-blue-200 rounded-lg">
					<Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
					<span className="text-sm text-blue-700">Uploading PDF...</span>
				</div>
			) : pickedFile ? (
				/* ── File picked ── */
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
				/* ── Dropzone ── */
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

			{fileError && <p className="text-xs text-red-600">{fileError}</p>}
			<p className="text-xs text-blue-600/70">
				Publicly visible on the portal. Max 5 MB, PDF only.
			</p>
		</div>
	);
}
