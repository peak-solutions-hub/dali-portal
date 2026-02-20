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

interface ConfirmDiscardDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function ConfirmDiscardDialog({
	open,
	onOpenChange,
	onConfirm,
}: ConfirmDiscardDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-1">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
							<AlertTriangle className="h-5 w-5 text-red-600" />
						</div>
						<DialogTitle className="text-lg">Discard Changes?</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-gray-600 pl-13">
						All unsaved changes will be lost and the session will revert to its
						last saved state. This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="cursor-pointer"
					>
						Cancel
					</Button>
					<Button
						className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
						onClick={() => {
							onOpenChange(false);
							onConfirm();
						}}
					>
						Discard Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
