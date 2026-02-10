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
import { AlertTriangle, Undo2 } from "@repo/ui/lib/lucide-react";
import { useState } from "react";

interface UnpublishSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionId: string;
	sessionNumber: string;
	onUnpublished?: () => void;
}

export function UnpublishSessionDialog({
	open,
	onOpenChange,
	sessionId,
	sessionNumber,
	onUnpublished,
}: UnpublishSessionDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleUnpublish = async () => {
		setError(null);
		setIsSubmitting(true);

		try {
			// TODO: Call API to unpublish session
			// const [err, data] = await api.sessions.updateStatus({
			//   id: sessionId,
			//   status: 'draft'
			// })

			// Mock success
			await new Promise((resolve) => setTimeout(resolve, 1000));

			onOpenChange(false);
			if (onUnpublished) {
				onUnpublished();
			}
		} catch {
			setError("Failed to unpublish session. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
							<AlertTriangle className="h-5 w-5 text-amber-600" />
						</div>
						<div>
							<DialogTitle className="text-xl font-semibold text-gray-900">
								Unpublish Session?
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-0.5">
								Return this session to draft status
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="space-y-4">
					<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
						<div className="flex items-start gap-2">
							<AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
							<div>
								<p className="text-sm font-medium text-amber-800 mb-1">
									This action will revert Session #{sessionNumber} to a draft
								</p>
								<p className="text-xs text-amber-700">
									The session will no longer be visible on the public portal
									until it is published again.
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-sm text-gray-600">
							Unpublishing this session will:
						</p>
						<ul className="space-y-1.5 text-sm text-gray-600">
							<li className="flex items-start gap-2">
								<span className="text-amber-500 mt-0.5">•</span>
								<span>Remove the session from the public portal</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-amber-500 mt-0.5">•</span>
								<span>Return the session status to Draft</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-amber-500 mt-0.5">•</span>
								<span>Allow further editing of the agenda</span>
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
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
						className="cursor-pointer"
					>
						Cancel
					</Button>
					<Button
						onClick={handleUnpublish}
						disabled={isSubmitting}
						className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
					>
						<Undo2 className="h-4 w-4 mr-2" />
						{isSubmitting ? "Unpublishing..." : "Unpublish Session"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
