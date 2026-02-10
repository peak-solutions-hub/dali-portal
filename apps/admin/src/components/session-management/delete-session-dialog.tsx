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
import { AlertTriangle, Trash2 } from "@repo/ui/lib/lucide-react";
import { useState } from "react";

interface DeleteSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionId: string;
	sessionNumber: string;
	onDeleted?: () => void;
}

export function DeleteSessionDialog({
	open,
	onOpenChange,
	sessionId,
	sessionNumber,
	onDeleted,
}: DeleteSessionDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleDelete = async () => {
		setError(null);
		setIsSubmitting(true);

		try {
			// TODO: Call API to delete session
			// const [err, data] = await api.sessions.delete({
			//   id: sessionId,
			// })

			// Mock success
			await new Promise((resolve) => setTimeout(resolve, 1000));

			onOpenChange(false);
			if (onDeleted) {
				onDeleted();
			}
		} catch {
			setError("Failed to delete session. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
							<Trash2 className="h-5 w-5 text-red-600" />
						</div>
						<div>
							<DialogTitle className="text-xl font-semibold text-gray-900">
								Delete Draft Session?
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-0.5">
								This action cannot be undone
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="space-y-4">
					<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
						<div className="flex items-start gap-2">
							<AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
							<div>
								<p className="text-sm font-medium text-red-800 mb-1">
									You are about to permanently delete Session #{sessionNumber}
								</p>
								<p className="text-xs text-red-700">
									All agenda items and attached documents for this draft session
									will be removed permanently.
								</p>
							</div>
						</div>
					</div>

					<p className="text-sm text-gray-600">
						This will permanently delete the draft session and all its
						associated data. This action cannot be reversed.
					</p>

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
						onClick={handleDelete}
						disabled={isSubmitting}
						className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
					>
						<Trash2 className="h-4 w-4 mr-2" />
						{isSubmitting ? "Deleting..." : "Delete Draft"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
