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
import { CheckCircle2, Loader2, Send } from "@repo/ui/lib/lucide-react";
import { useState } from "react";

interface PublishSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionNumber: string;
	onConfirm?: () => void | Promise<void>;
}

export function PublishSessionDialog({
	open,
	onOpenChange,
	sessionNumber,
	onConfirm,
}: PublishSessionDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleOpenChange = (nextOpen: boolean) => {
		if (isSubmitting) return;
		onOpenChange(nextOpen);
	};

	const handlePublish = async () => {
		setError(null);
		setIsSubmitting(true);

		try {
			if (onConfirm) await onConfirm();
			onOpenChange(false);
		} catch {
			setError("Failed to publish session. Please try again.");
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
						<div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
							<Send className="h-5 w-5 text-green-600" />
						</div>
						<div>
							<DialogTitle className="text-xl font-semibold text-gray-900">
								Finalize & Publish?
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-0.5">
								This session will be made public
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="space-y-4">
					<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
						<div className="flex items-start gap-2">
							<Send className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
							<div>
								<p className="text-sm font-medium text-green-800 mb-1">
									Publish Session #{sessionNumber}
								</p>
								<p className="text-xs text-green-700">
									The session will be scheduled and visible on the public
									portal. Ensure all agenda items and documents are finalized.
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-sm text-gray-600">
							Publishing this session will:
						</p>
						<ul className="space-y-1.5 text-sm text-gray-600">
							<li className="flex items-start gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
								<span>Make the session visible on the public portal</span>
							</li>
							<li className="flex items-start gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
								<span>Change the session status to Scheduled</span>
							</li>
							<li className="flex items-start gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
								<span>Enable presentation mode for this session</span>
							</li>
						</ul>
					</div>

					{/* Error Message */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
						onClick={handlePublish}
						disabled={isSubmitting}
						className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
					>
						{isSubmitting ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Send className="h-4 w-4 mr-2" />
						)}
						{isSubmitting ? "Publishing..." : "Publish Session"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
