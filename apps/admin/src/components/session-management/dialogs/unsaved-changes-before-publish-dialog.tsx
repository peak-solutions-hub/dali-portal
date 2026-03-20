"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { AlertTriangle, Loader2, Save } from "@repo/ui/lib/lucide-react";
import { useState } from "react";

interface UnsavedChangesBeforePublishDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Save changes and then proceed to the publish dialog */
	onSaveAndProceed: () => void | Promise<void>;
	/** Cancel and go back to editing */
	onCancel: () => void;
}

export function UnsavedChangesBeforePublishDialog({
	open,
	onOpenChange,
	onSaveAndProceed,
	onCancel,
}: UnsavedChangesBeforePublishDialogProps) {
	const [isSaving, setIsSaving] = useState(false);

	const handleSaveAndProceed = async () => {
		setIsSaving(true);
		try {
			await onSaveAndProceed();
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		onOpenChange(false);
		onCancel();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (isSaving) return;
				onOpenChange(nextOpen);
			}}
		>
			<DialogContent
				className="max-w-md"
				showCloseButton={!isSaving}
				onInteractOutside={(e) => {
					if (isSaving) e.preventDefault();
				}}
				onEscapeKeyDown={(e) => {
					if (isSaving) e.preventDefault();
				}}
			>
				<DialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
							<AlertTriangle className="h-5 w-5 text-amber-600" />
						</div>
						<div>
							<DialogTitle className="text-lg">Unsaved Changes</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-0.5">
								You have unsaved changes in the current session.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="pl-13">
					<p className="text-sm text-gray-600">
						Would you like to save your changes before proceeding to publish?
					</p>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isSaving}
						className="cursor-pointer"
					>
						Cancel
					</Button>
					<Button
						className="cursor-pointer bg-amber-500 text-white hover:bg-amber-600"
						onClick={handleSaveAndProceed}
						disabled={isSaving}
					>
						{isSaving ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 mr-2" />
						)}
						{isSaving ? "Saving..." : "Save & Continue"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
