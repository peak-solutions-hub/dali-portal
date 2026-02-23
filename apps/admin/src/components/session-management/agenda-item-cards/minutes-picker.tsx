import type { SessionManagementSession } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Calendar as CalendarComponent } from "@repo/ui/components/calendar";
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
import { Calendar } from "@repo/ui/lib/lucide-react";
import { getSessionTypeLabel } from "@repo/ui/lib/session-ui";
import { format } from "date-fns";
import parse from "html-react-parser";
import { sanitizeQuillHtml } from "@/utils/quill-html-utils.client";

/** Formats a "YYYY-MM-DD" date string as "January 15, 2024" (local, timezone-safe) */
function formatMinutesDate(dateStr: string): string {
	const [year, month, day] = dateStr.split("-");
	const d = new Date(Number(year), Number(month) - 1, Number(day));
	return d.toLocaleDateString("en-US", {
		month: "long",
		day: "2-digit",
		year: "numeric",
	});
}

interface MinutesPickerProps {
	sessions: SessionManagementSession[];
	selectedSessionId?: string;
	contentText?: string;
	isCustomMinutesResolved: boolean;
	customDate: Date | undefined;
	setCustomDate: (date: Date | undefined) => void;
	customSessionType: string;
	setCustomSessionType: (type: string) => void;
	derivedMinutesSessionId: string;
	onMinutesSessionSelect: (sessionId: string) => void;
	onCustomMinutesChange: (date: Date | undefined, type: string) => void;
}

export function MinutesPicker({
	sessions,
	selectedSessionId,
	contentText,
	isCustomMinutesResolved,
	customDate,
	setCustomDate,
	customSessionType,
	setCustomSessionType,
	derivedMinutesSessionId,
	onMinutesSessionSelect,
	onCustomMinutesChange,
}: MinutesPickerProps) {
	const minutesSessions = sessions.filter(
		(s) => s.id !== selectedSessionId && s.status === "completed",
	);

	return (
		<div className="space-y-1.5">
			<label className="text-xs font-medium text-gray-600">
				Select session minutes to approve
			</label>
			<Select
				value={derivedMinutesSessionId}
				onValueChange={onMinutesSessionSelect}
			>
				<SelectTrigger className="w-full cursor-pointer">
					<SelectValue placeholder="Choose a session…" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="__none__" className="cursor-pointer text-gray-400">
						None
					</SelectItem>
					{minutesSessions.map((s) => (
						<SelectItem key={s.id} value={s.id} className="cursor-pointer">
							<div className="flex items-center gap-2">
								<span>
									{formatMinutesDate(s.date)} — {getSessionTypeLabel(s.type)}
								</span>
								<span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
									Completed
								</span>
							</div>
						</SelectItem>
					))}
					<SelectItem
						value="__custom__"
						className="cursor-pointer text-blue-600"
					>
						Enter custom date &amp; session type…
					</SelectItem>
				</SelectContent>
			</Select>

			{isCustomMinutesResolved && (
				<div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-3">
					<div className="flex-1 space-y-1">
						<label className="text-xs font-medium text-gray-600">Date</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start text-left font-normal cursor-pointer bg-white"
								>
									<Calendar className="mr-2 h-4 w-4" />
									{customDate ? format(customDate, "PPP") : "Pick a date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<CalendarComponent
									mode="single"
									selected={customDate}
									onSelect={(date) => {
										setCustomDate(date);
										onCustomMinutesChange(date, customSessionType);
									}}
									defaultMonth={customDate ?? new Date()}
									captionLayout="dropdown"
									fromYear={2000}
									toYear={new Date().getFullYear()}
									classNames={{
										today: "bg-transparent text-yellow-400 font-normal",
										day_selected:
											"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
									}}
								/>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1 space-y-1">
						<label className="text-xs font-medium text-gray-600">
							Session type
						</label>
						<Select
							value={customSessionType || "__none__"}
							onValueChange={(val) => {
								const type = val === "__none__" ? "" : val;
								setCustomSessionType(type);
								onCustomMinutesChange(customDate, type);
							}}
						>
							<SelectTrigger className="w-full cursor-pointer bg-white">
								<SelectValue placeholder="Select type…" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem
									value="__none__"
									className="cursor-pointer text-gray-400"
								>
									Select type…
								</SelectItem>
								<SelectItem value="Regular Session" className="cursor-pointer">
									Regular Session
								</SelectItem>
								<SelectItem value="Special Session" className="cursor-pointer">
									Special Session
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			{contentText && (
				<p className="text-xs text-gray-500 italic mt-1">
					Preview: {contentText}
				</p>
			)}
		</div>
	);
}

interface MinutesReadOnlyProps {
	contentText: string;
}

export function MinutesReadOnly({ contentText }: MinutesReadOnlyProps) {
	return (
		<div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
			{parse(sanitizeQuillHtml(contentText) ?? "")}
		</div>
	);
}
