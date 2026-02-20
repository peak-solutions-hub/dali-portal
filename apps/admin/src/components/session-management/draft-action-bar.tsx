"use client";

import { Button } from "@repo/ui/components/button";
import {
	Loader2,
	RotateCcw,
	Save,
	Send,
	Trash2,
} from "@repo/ui/lib/lucide-react";

interface DraftActionBarProps {
	actionInFlight?: string | null;
	hasChanges?: boolean;
	isSessionEmpty?: boolean;
	onShowSaveDraftDialog: () => void;
	onShowPublishDialog: () => void;
	onShowDeleteDialog: () => void;
	onDiscardChanges?: () => void;
}

export function DraftActionBar({
	actionInFlight,
	hasChanges = true,
	isSessionEmpty = false,
	onShowSaveDraftDialog,
	onShowPublishDialog,
	onShowDeleteDialog,
	onDiscardChanges,
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
					{actionInFlight === "saving" ? "Saving..." : "Save Changes"}
				</Button>
				<Button
					className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					onClick={onShowPublishDialog}
					disabled={!!actionInFlight || isSessionEmpty}
					title={
						isSessionEmpty
							? "Add documents or content before publishing"
							: undefined
					}
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
			<div className="flex gap-2">
				{onDiscardChanges && (
					<Button
						variant="outline"
						className="flex-1 cursor-pointer border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={onDiscardChanges}
						disabled={!!actionInFlight || !hasChanges}
						title={!hasChanges ? "No changes to discard" : undefined}
					>
						<RotateCcw className="h-4 w-4 mr-2" />
						Discard Changes
					</Button>
				)}
				<Button
					variant="outline"
					className={`cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 ${onDiscardChanges ? "flex-1" : "w-full"}`}
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
		</div>
	);
}
