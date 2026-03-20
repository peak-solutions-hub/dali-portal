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
import { CheckCircle2, Info, Loader2 } from "@repo/ui/lib/lucide-react";
import { useState } from "react";

interface MarkCompleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionNumber: string;
	sessionType: string;
	sessionDate: string;
	onConfirm?: () => void | Promise<void>;
}

export function MarkCompleteDialog({
	open,
	onOpenChange,
	sessionNumber,
	sessionType,
	sessionDate,
	onConfirm,
}: MarkCompleteDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleOpenChange = (nextOpen: boolean) => {
		if (isSubmitting) return;
		onOpenChange(nextOpen);
	};

	const handleConfirm = async () => {
		setIsSubmitting(true);
		try {
			if (onConfirm) await onConfirm();
			onOpenChange(false);
		} catch {
			// Error handled by parent via toast
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
							<CheckCircle2 className="h-5 w-5 text-green-600" />
						</div>
						<div>
							<DialogTitle className="text-xl font-semibold text-gray-900">
								Mark Session as Complete?
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-0.5">
								This will finalize and archive this session
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="space-y-4">
					{/* Session Info Card */}
					<div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
						<div className="flex items-center gap-2">
							<Info className="h-4 w-4 text-green-600 shrink-0" />
							<div>
								<p className="text-sm font-semibold text-green-900">
									Session #{sessionNumber}
								</p>
								<p className="text-xs text-green-700">
									{sessionType} • {sessionDate}
								</p>
							</div>
						</div>
					</div>

					{/* Description */}
					<div className="space-y-3">
						<p className="text-sm text-gray-600">
							Once marked as complete, this session will be:
						</p>
						<ul className="space-y-2 text-sm text-gray-600">
							<li className="flex items-start gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
								<span>Archived and moved to completed sessions</span>
							</li>
							<li className="flex items-start gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
								<span>Available for viewing and reference</span>
							</li>
							<li className="flex items-start gap-2">
								<CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
								<span>Locked from further editing</span>
							</li>
						</ul>
					</div>
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
						onClick={handleConfirm}
						disabled={isSubmitting}
						className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
					>
						{isSubmitting ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<CheckCircle2 className="h-4 w-4 mr-2" />
						)}
						{isSubmitting ? "Completing..." : "Mark Complete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
