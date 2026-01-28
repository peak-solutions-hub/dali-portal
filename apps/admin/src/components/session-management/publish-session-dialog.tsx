"use client";

import { Button } from "@repo/ui/components/button";
import {
	AlertTriangle,
	CheckCircle,
	Upload,
	X,
} from "@repo/ui/lib/lucide-react";
import { useState } from "react";

interface PublishSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionId: string;
	agendaItemCount: number;
	onPublished?: () => void;
}

export function PublishSessionDialog({
	open,
	onOpenChange,
	sessionId,
	agendaItemCount,
	onPublished,
}: PublishSessionDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handlePublish = async () => {
		setError(null);
		setIsSubmitting(true);

		try {
			// Validate: must have at least one agenda item
			if (agendaItemCount === 0) {
				setError("Cannot publish session without agenda items");
				setIsSubmitting(false);
				return;
			}

			// TODO: Call API to publish session
			// const [err, data] = await api.sessions.updateStatus({
			//   id: sessionId,
			//   status: 'scheduled'
			// })

			// Mock success
			await new Promise((resolve) => setTimeout(resolve, 1000));

			onOpenChange(false);
			if (onPublished) {
				onPublished();
			}
		} catch {
			setError("Failed to publish session. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const canPublish = agendaItemCount > 0;

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
			onClick={() => onOpenChange(false)}
		>
			<div
				className="bg-white rounded-lg max-w-md w-full shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<div className="flex items-center gap-3">
						<div
							className={`h-10 w-10 rounded-full flex items-center justify-center ${
								canPublish ? "bg-green-100" : "bg-yellow-100"
							}`}
						>
							{canPublish ? (
								<CheckCircle className="h-5 w-5 text-green-600" />
							) : (
								<AlertTriangle className="h-5 w-5 text-yellow-600" />
							)}
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Publish Session
							</h2>
							<p className="text-sm text-gray-600 mt-0.5">
								{canPublish
									? "Make this session public on the portal"
									: "Session not ready to publish"}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="text-gray-400 hover:text-gray-600 cursor-pointer"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-4">
					{canPublish ? (
						<>
							{/* Ready to Publish */}
							<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<span className="text-sm text-gray-600">Agenda Items</span>
								<span className="font-semibold text-gray-900">
									{agendaItemCount} {agendaItemCount === 1 ? "item" : "items"}
								</span>
							</div>

							<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
								<div className="flex items-start gap-2">
									<CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
									<p className="text-sm text-green-800">
										Session is ready to be published
									</p>
								</div>
							</div>

							<p className="text-sm text-gray-600">
								Once published, the session will appear on the public portal.
								You can unpublish it later if needed.
							</p>
						</>
					) : (
						<>
							{/* Not Ready */}
							<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div className="flex items-start gap-2">
									<AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
									<div>
										<p className="text-sm font-medium text-yellow-800 mb-1">
											At least one agenda item is required
										</p>
										<p className="text-xs text-yellow-700">
											Add documents or custom agenda items before publishing
										</p>
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<span className="text-sm text-gray-600">Agenda Items</span>
								<span className="font-semibold text-red-600">0 items</span>
							</div>
						</>
					)}

					{/* Error Message */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-800">{error}</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
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
						onClick={handlePublish}
						disabled={!canPublish || isSubmitting}
						className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Upload className="h-4 w-4 mr-2" />
						{isSubmitting ? "Publishing..." : "Publish Session"}
					</Button>
				</div>
			</div>
		</div>
	);
}
