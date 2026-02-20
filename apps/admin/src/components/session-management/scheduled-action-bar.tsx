"use client";

import type { SessionManagementSession as Session } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { CheckCircle2, Loader2, Undo2 } from "@repo/ui/lib/lucide-react";
import { AgendaPdfUpload } from "./agenda-pdf-upload";

interface ScheduledActionBarProps {
	selectedSession: Session;
	actionInFlight?: string | null;
	onShowUnpublishDialog: () => void;
	onShowMarkCompleteDialog: () => void;
	onUploadAgendaPdf?: (file: File) => void;
	onRemoveAgendaPdf?: () => void;
	isUploadingPdf?: boolean;
	isRemovingPdf?: boolean;
}

export function ScheduledActionBar({
	selectedSession,
	actionInFlight,
	onShowUnpublishDialog,
	onShowMarkCompleteDialog,
	onUploadAgendaPdf,
	onRemoveAgendaPdf,
	isUploadingPdf,
	isRemovingPdf,
}: ScheduledActionBarProps) {
	return (
		<div className="space-y-2.5 border-b border-gray-200 pb-3">
			{/* Agenda PDF Upload — prominent, above actions */}
			<AgendaPdfUpload
				selectedSession={selectedSession}
				onUploadAgendaPdf={onUploadAgendaPdf}
				onRemoveAgendaPdf={onRemoveAgendaPdf}
				isUploadingPdf={isUploadingPdf}
				isRemovingPdf={isRemovingPdf}
			/>

			{/* Action Buttons */}
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
