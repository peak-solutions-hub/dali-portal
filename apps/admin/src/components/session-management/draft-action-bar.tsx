"use client";

import { Button } from "@repo/ui/components/button";
import { Loader2, Save, Send, Trash2 } from "@repo/ui/lib/lucide-react";

interface DraftActionBarProps {
	actionInFlight?: string | null;
	hasChanges?: boolean;
	onShowSaveDraftDialog: () => void;
	onShowPublishDialog: () => void;
	onShowDeleteDialog: () => void;
}

export function DraftActionBar({
	actionInFlight,
	hasChanges = true,
	onShowSaveDraftDialog,
	onShowPublishDialog,
	onShowDeleteDialog,
}: DraftActionBarProps) {
	return (
		<div className="space-y-2 border-t border-gray-200 pt-3">
			<div className="flex gap-2">
				<Button
					className="flex-1 cursor-pointer bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
					onClick={onShowSaveDraftDialog}
					disabled={!!actionInFlight || !hasChanges}
					title={!hasChanges ? "No unsaved changes" : undefined}
				>
					{actionInFlight === "saving" ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<Save className="h-4 w-4 mr-2" />
					)}
					{actionInFlight === "saving" ? "Saving..." : "Save as Draft"}
				</Button>
				<Button
					className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
					onClick={onShowPublishDialog}
					disabled={!!actionInFlight}
				>
					{actionInFlight === "publishing" ? (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					) : (
						<Send className="h-4 w-4 mr-2" />
					)}
					{actionInFlight === "publishing"
						? "Publishing..."
						: "Finalize & Publish"}
				</Button>
			</div>
			<Button
				variant="outline"
				className="w-full cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
				onClick={onShowDeleteDialog}
				disabled={!!actionInFlight}
			>
				{actionInFlight === "deleting" ? (
					<Loader2 className="h-4 w-4 mr-2 animate-spin" />
				) : (
					<Trash2 className="h-4 w-4 mr-2" />
				)}
				{actionInFlight === "deleting" ? "Deleting..." : "Delete Draft"}
			</Button>
		</div>
	);
}
