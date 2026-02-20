"use client";

import type { SessionManagementSession as Session } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	CheckCircle2,
	FileText,
	Loader2,
	Trash2,
	Upload,
	X,
} from "@repo/ui/lib/lucide-react";
import { useRef, useState } from "react";

const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB

interface AgendaPdfUploadProps {
	selectedSession: Session;
	onUploadAgendaPdf?: (file: File) => void;
	onRemoveAgendaPdf?: () => void;
	isUploadingPdf?: boolean;
	isRemovingPdf?: boolean;
}

export function AgendaPdfUpload({
	selectedSession,
	onUploadAgendaPdf,
	onRemoveAgendaPdf,
	isUploadingPdf = false,
	isRemovingPdf = false,
}: AgendaPdfUploadProps) {
	const [agendaFile, setAgendaFile] = useState<File | null>(null);
	const agendaFileInputRef = useRef<HTMLInputElement>(null);
	const [pdfError, setPdfError] = useState<string | null>(null);

	return (
		<div className="rounded-lg border border-blue-200 bg-blue-50/60 p-2.5">
			<label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-1.5">
				<FileText className="h-4 w-4 text-blue-600" />
				Agenda PDF (Public)
			</label>
			<input
				ref={agendaFileInputRef}
				type="file"
				accept=".pdf"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) {
						if (file.size > MAX_PDF_SIZE) {
							setPdfError(
								`File exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB). Please choose a smaller file.`,
							);
							if (agendaFileInputRef.current)
								agendaFileInputRef.current.value = "";
							return;
						}
						setPdfError(null);
						setAgendaFile(file);
						onUploadAgendaPdf?.(file);
						// Reset input so re-selecting the same file triggers onChange
						if (agendaFileInputRef.current)
							agendaFileInputRef.current.value = "";
					}
				}}
			/>
			{isUploadingPdf ? (
				<div className="flex items-center justify-center gap-2 p-3 bg-white border border-blue-200 rounded-lg">
					<Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
					<span className="text-sm text-blue-700">Uploading PDF...</span>
				</div>
			) : selectedSession?.agendaFilePath ? (
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
						className="cursor-pointer text-green-600 hover:text-red-600 hover:bg-red-50"
						onClick={onRemoveAgendaPdf}
						disabled={isRemovingPdf}
					>
						{isRemovingPdf ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Trash2 className="h-4 w-4" />
						)}
					</Button>
				</div>
			) : agendaFile ? (
				<div className="flex items-center gap-2 p-2.5 bg-white border border-blue-200 rounded-lg">
					<FileText className="h-4 w-4 text-blue-600 shrink-0" />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-blue-800 truncate">
							{agendaFile.name}
						</p>
						<p className="text-xs text-blue-600">
							{(agendaFile.size / 1024 / 1024).toFixed(2)} MB
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="cursor-pointer text-blue-600 hover:text-red-600 hover:bg-red-50"
						onClick={() => {
							setAgendaFile(null);
							if (agendaFileInputRef.current)
								agendaFileInputRef.current.value = "";
						}}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : (
				<Button
					variant="outline"
					className={`w-full cursor-pointer border-dashed bg-white ${
						pdfError
							? "border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500"
							: "border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
					}`}
					onClick={() => {
						setPdfError(null);
						agendaFileInputRef.current?.click();
					}}
					disabled={isUploadingPdf}
				>
					<Upload className="h-4 w-4 mr-2" />
					Upload Agenda PDF
				</Button>
			)}
			{pdfError && <p className="text-xs text-red-600 mt-1">{pdfError}</p>}
			<p className="text-xs text-blue-600/70 mt-1.5">
				This agenda will be publicly available for viewing. Max 5MB.
			</p>
		</div>
	);
}
