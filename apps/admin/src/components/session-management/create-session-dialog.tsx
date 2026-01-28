"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Calendar, Plus, X } from "@repo/ui/lib/lucide-react";
import { useState } from "react";

interface CreateSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSessionCreated?: (sessionId: string) => void;
}

export function CreateSessionDialog({
	open,
	onOpenChange,
	onSessionCreated,
}: CreateSessionDialogProps) {
	const [sessionDate, setSessionDate] = useState("");
	const [sessionTime, setSessionTime] = useState("10:00");
	const [sessionType, setSessionType] = useState("regular");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			// Validate Wednesday
			const date = new Date(sessionDate);
			if (date.getDay() !== 3) {
				setError("Sessions must be scheduled on Wednesdays");
				setIsSubmitting(false);
				return;
			}

			// TODO: Call API to create session
			// const [err, data] = await api.sessions.create({
			//   scheduleDate: new Date(sessionDate),
			//   sessionTime,
			//   type: sessionType,
			// })

			// Mock success
			await new Promise((resolve) => setTimeout(resolve, 1000));

			onOpenChange(false);
			if (onSessionCreated) {
				onSessionCreated("mock-session-id");
			}
		} catch {
			setError("Failed to create session. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
			onClick={() => onOpenChange(false)}
		>
			<div
				className="bg-white rounded-lg max-w-lg w-full shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
							<Plus className="h-5 w-5 text-blue-600" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Create New Session
							</h2>
							<p className="text-sm text-gray-600 mt-0.5">
								Schedule a new council session on Wednesday
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

				{/* Form */}
				<form onSubmit={handleSubmit}>
					<div className="p-6 space-y-4">
						{/* Session Type */}
						<div className="space-y-2">
							<label
								htmlFor="session-type"
								className="text-sm font-medium text-gray-700"
							>
								Session Type
							</label>
							<Select value={sessionType} onValueChange={setSessionType}>
								<SelectTrigger id="session-type" className="cursor-pointer">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="regular" className="cursor-pointer">
										Regular Session
									</SelectItem>
									<SelectItem value="special" className="cursor-pointer">
										Special Session
									</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-gray-500">
								Regular sessions are held weekly on Wednesdays
							</p>
						</div>

						{/* Session Date */}
						<div className="space-y-2">
							<label
								htmlFor="session-date"
								className="text-sm font-medium text-gray-700"
							>
								Session Date <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<Input
									id="session-date"
									type="date"
									value={sessionDate}
									onChange={(e) => setSessionDate(e.target.value)}
									required
									className="pl-10 cursor-pointer"
								/>
								<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
							</div>
							<p className="text-xs text-gray-500">
								Must be a Wednesday (council session day)
							</p>
						</div>

						{/* Session Time */}
						<div className="space-y-2">
							<label
								htmlFor="session-time"
								className="text-sm font-medium text-gray-700"
							>
								Session Time
							</label>
							<Input
								id="session-time"
								type="time"
								value={sessionTime}
								onChange={(e) => setSessionTime(e.target.value)}
								className="cursor-pointer"
							/>
							<p className="text-xs text-gray-500">
								Default: 10:00 AM (regular sessions)
							</p>
						</div>

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
							type="submit"
							disabled={isSubmitting}
							className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
						>
							<Plus className="h-4 w-4 mr-2" />
							{isSubmitting ? "Creating..." : "Create Session"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
