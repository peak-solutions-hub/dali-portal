"use client";

import { Button } from "@repo/ui/components/button";
import { AlertCircle, CheckCircle2, Info, X } from "@repo/ui/lib/lucide-react";

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
	if (!open) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
			onClick={onCancel}
		>
			<div
				className="bg-white rounded-lg max-w-md w-full shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
							<AlertCircle className="h-5 w-5 text-amber-600" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Mark Session as Complete?
							</h2>
							<p className="text-sm text-gray-600 mt-0.5">
								This will finalize and archive this session
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onCancel}
						className="text-gray-400 hover:text-gray-600 cursor-pointer"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-4">
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

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
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
				</div>
			</div>
		</div>
	);
}
