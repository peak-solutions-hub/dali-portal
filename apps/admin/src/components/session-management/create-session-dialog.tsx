"use client";

import { Button } from "@repo/ui/components/button";
import { Calendar as CalendarComponent } from "@repo/ui/components/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Calendar, Plus } from "@repo/ui/lib/lucide-react";
import { format } from "date-fns";
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
	const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
	const [sessionTime, setSessionTime] = useState("10:00");
	const [sessionType, setSessionType] = useState("regular");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			// Validate date
			if (!sessionDate) {
				setError("Please select a session date");
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
							<Plus className="h-5 w-5 text-blue-600" />
						</div>
						<div>
							<DialogTitle className="text-xl font-semibold text-gray-900">
								Create New Session
							</DialogTitle>
							<DialogDescription className="text-sm text-gray-600 mt-0.5">
								Schedule a new council session
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Form */}
				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
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
								Regular sessions are held weekly
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
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-start text-left font-normal cursor-pointer"
									>
										<Calendar className="mr-2 h-4 w-4" />
										{sessionDate ? format(sessionDate, "PPP") : "Pick a date"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<CalendarComponent
										mode="single"
										selected={sessionDate}
										onSelect={setSessionDate}
										classNames={{
											today: "bg-transparent text-yellow-400 font-normal",
											day_selected:
												"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
										}}
									/>
								</PopoverContent>
							</Popover>{" "}
							<p className="text-xs text-gray-500">
								Select the desired session date
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

					<DialogFooter className="mt-6">
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
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
