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
import { Loader2, Save } from "@repo/ui/lib/lucide-react";
import { useState } from "react";

interface SaveBeforeCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaveAndCreate: () => Promise<void> | void;
}

export function SaveBeforeCreateDialog({
	open,
	onOpenChange,
	onSaveAndCreate,
}: SaveBeforeCreateDialogProps) {
	const [isSaving, setIsSaving] = useState(false);

	const handleSaveAndCreate = async () => {
		setIsSaving(true);
		try {
			await onSaveAndCreate();
			onOpenChange(false);
		} catch {
			// Error handled by parent
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (isSaving) return;
				onOpenChange(nextOpen);
			}}
		>
			<DialogContent className="max-w-md" showCloseButton={!isSaving}>
				<DialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
							<Save className="h-5 w-5 text-amber-600" />
						</div>
						<DialogTitle className="text-lg">Unsaved Changes</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-gray-600 pl-13">
						You have unsaved changes in the current session. Your changes will
						be saved before creating a new session.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
						className="cursor-pointer"
					>
						Cancel
					</Button>
					<Button
						className="cursor-pointer bg-amber-500 text-white hover:bg-amber-600"
						onClick={handleSaveAndCreate}
						disabled={isSaving}
					>
						{isSaving ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 mr-2" />
						)}
						{isSaving ? "Saving..." : "Save & Create New"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
