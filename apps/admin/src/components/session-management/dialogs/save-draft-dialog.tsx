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

interface SaveDraftDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionNumber: string;
	onConfirm?: () => void | Promise<void>;
}

export function SaveDraftDialog({
	open,
	onOpenChange,
	sessionNumber,
	onConfirm,
}: SaveDraftDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleOpenChange = (nextOpen: boolean) => {
		if (isSubmitting) return;
		onOpenChange(nextOpen);
	};

	const handleSave = async () => {
		setError(null);
		setIsSubmitting(true);

		try {
			if (onConfirm) await onConfirm();
			onOpenChange(false);
		} catch {
			setError("Failed to save changes. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="max-w-md"
				showCloseButton={!isSubmitting}
				onInteractOutside={(e) => {
					if (isSubmitting) e.preventDefault();
				}}
				onEscapeKeyDown={(e) => {
					if (isSubmitting) e.preventDefault();
				}}
			>
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
							<Save className="h-5 w-5 text-amber-600" aria-hidden="true" />
						</div>
						<div>
							<DialogTitle className="text-xl font-semibold text-gray-900">
								Save Changes?
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-0.5">
								Your changes will be saved
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="space-y-4">
					<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
						<div className="flex items-start gap-2">
							<Save
								className="h-4 w-4 text-amber-600 mt-0.5 shrink-0"
								aria-hidden="true"
							/>
							<div>
								<p className="text-sm font-medium text-amber-800 mb-1">
									Save changes to Session #{sessionNumber}
								</p>
								<p className="text-xs text-amber-700">
									Your changes will be saved. You can continue editing or
									publish the session when ready.
								</p>
							</div>
						</div>
					</div>

					<p className="text-sm text-gray-600">
						Draft sessions are not visible to the public. You can finalize and
						publish the session when ready.
					</p>

					{/* Error Message */}
					{error && (
						<div
							className="p-3 bg-red-50 border border-red-200 rounded-lg"
							role="alert"
							aria-live="assertive"
						>
							<p className="text-sm text-red-800">{error}</p>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isSubmitting}
						className="cursor-pointer"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={isSubmitting}
						className="bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
					>
						{isSubmitting ? (
							<Loader2
								className="h-4 w-4 mr-2 animate-spin"
								aria-hidden="true"
							/>
						) : (
							<Save className="h-4 w-4 mr-2" aria-hidden="true" />
						)}
						{isSubmitting ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
