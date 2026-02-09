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
import { AlertCircle, CheckCircle2, Info } from "@repo/ui/lib/lucide-react";

interface MarkCompleteDialogProps {
	open: boolean;
	sessionNumber: string;
	sessionType: string;
	sessionDate: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function MarkCompleteDialog({
	open,
	sessionNumber,
	sessionType,
	sessionDate,
	onConfirm,
	onCancel,
}: MarkCompleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
							<AlertCircle className="h-5 w-5 text-amber-600" />
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
					<div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="flex items-center gap-2">
							<Info className="h-4 w-4 text-blue-600 shrink-0" />
							<div>
								<p className="text-sm font-semibold text-blue-900">
									Session #{sessionNumber}
								</p>
								<p className="text-xs text-blue-700">
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
						onClick={onCancel}
						className="cursor-pointer"
					>
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
					>
						<CheckCircle2 className="h-4 w-4 mr-2" />
						Mark Complete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
