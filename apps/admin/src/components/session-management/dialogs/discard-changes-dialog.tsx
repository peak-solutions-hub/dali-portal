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
import { AlertTriangle } from "@repo/ui/lib/lucide-react";

interface DiscardChangesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDiscard: () => void;
}

export function DiscardChangesDialog({
	open,
	onOpenChange,
	onDiscard,
}: DiscardChangesDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
							<AlertTriangle className="h-5 w-5 text-amber-600" />
						</div>
						<DialogTitle className="text-lg">Unsaved Changes</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-gray-600 pl-13">
						You have unsaved changes in the current session. Creating a new
						session will discard them.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="cursor-pointer"
					>
						Cancel
					</Button>
					<Button
						className="cursor-pointer bg-amber-500 text-white hover:bg-amber-600"
						onClick={() => {
							onOpenChange(false);
							onDiscard();
						}}
					>
						Discard & Create New
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
