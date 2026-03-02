"use client";

import type { SessionManagementSession as Session } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	CheckCircle2,
	ChevronDown,
	FileText,
	Loader2,
	Undo2,
} from "@repo/ui/lib/lucide-react";
import { useState } from "react";
import { SessionAgendaPdfUpload } from "./session-agenda-pdf-upload";

interface SessionScheduledActionBarProps {
	selectedSession: Session;
	actionInFlight?: string | null;
	onShowUnpublishDialog: () => void;
	onShowMarkCompleteDialog: () => void;
	onRemoveAgendaPdf?: () => void;
	onAgendaPdfUploadSuccess?: () => Promise<void>;
	isRemovingPdf?: boolean;
}

export function SessionScheduledActionBar({
	selectedSession,
	actionInFlight,
	onShowUnpublishDialog,
	onShowMarkCompleteDialog,
	onRemoveAgendaPdf,
	onAgendaPdfUploadSuccess,
	isRemovingPdf,
}: SessionScheduledActionBarProps) {
	// Open by default when a PDF is already uploaded so it's immediately visible
	const [isPdfOpen, setIsPdfOpen] = useState(!!selectedSession.agendaFilePath);

	const hasPdf = !!selectedSession.agendaFilePath;

	return (
		<div className="space-y-2.5 border-b border-gray-200 pb-3">
			{/* ── Collapsible PDF section — owns the blue container ── */}
			<div className="rounded-lg border border-blue-200 bg-blue-50/60 overflow-hidden">
				{/* Toggle header */}
				<button
					type="button"
					onClick={() => setIsPdfOpen((prev) => !prev)}
					className="w-full flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100/50 transition-colors"
				>
					<div className="flex items-center gap-2">
						<FileText className="h-4 w-4 text-blue-600 shrink-0" />
						<span className="text-sm font-semibold text-blue-800">
							Agenda PDF (Public)
						</span>
						{hasPdf && (
							<span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20">
								Uploaded
							</span>
						)}
					</div>
					<ChevronDown
						className={`h-4 w-4 text-blue-500 transition-transform duration-200 ${isPdfOpen ? "rotate-180" : ""}`}
					/>
				</button>

				{/* Collapsible body — AgendaPdfUpload renders content only, no wrapper */}
				{isPdfOpen && (
					<div className="px-3 pb-3">
						<SessionAgendaPdfUpload
							selectedSession={selectedSession}
							onRemoveAgendaPdf={onRemoveAgendaPdf}
							onUploadSuccess={onAgendaPdfUploadSuccess}
							isRemovingPdf={isRemovingPdf}
						/>
					</div>
				)}
			</div>

			{/* ── Action buttons ── */}
			<div className="flex gap-2">
				<Button
					variant="outline"
					className="flex-1 cursor-pointer border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
					onClick={onShowUnpublishDialog}
					disabled={!!actionInFlight}
				>
					{actionInFlight === "unpublishing" ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<Undo2 className="h-4 w-4 mr-2" />
					)}
					{actionInFlight === "unpublishing"
						? "Unpublishing..."
						: "Unpublish to Draft"}
				</Button>
				<Button
					className="flex-1 cursor-pointer bg-green-600 hover:bg-green-700 text-white"
					onClick={onShowMarkCompleteDialog}
					disabled={!!actionInFlight}
				>
					{actionInFlight === "completing" ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<CheckCircle2 className="h-4 w-4 mr-2" />
					)}
					{actionInFlight === "completing"
						? "Completing..."
						: "Mark as Completed"}
				</Button>
			</div>
		</div>
	);
}
