"use client";

import {
	CONFERENCE_ROOM_OPTIONS,
	type ConferenceRoom,
	MAX_ATTACHMENT_SIZE_BYTES,
	TEXT_LIMITS,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
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
import { TimePicker } from "@repo/ui/components/time-picker";
import { cn } from "@repo/ui/lib/utils";
import { CalendarIcon, FileText, X } from "lucide-react";
import { useState } from "react";

export interface BookingFormValues {
	room: string;
	date: Date | undefined;
	startTime: string;
	endTime: string;
	title: string;
	requestedFor: string;
	attachment: File | null;
	removeExistingAttachment?: boolean;
}

interface BookingFormFieldsProps {
	values: BookingFormValues;
	onChange: (field: keyof BookingFormValues, value: unknown) => void;
	/** Whether there is an existing attachment on the server (edit mode). */
	existingAttachmentUrl?: string | null;
	/** Whether existing attachment is marked for removal on save (edit mode). */
	removeExistingAttachment?: boolean;
	/** Toggle remove existing attachment marker (edit mode). */
	onRemoveExistingAttachmentChange?: (value: boolean) => void;
	/** Form-level error message displayed at the top. */
	error?: string | null;
	/** File validation error. */
	fileError: string | null;
	onFileError: (msg: string | null) => void;
}

export function BookingFormFields({
	values,
	onChange,
	existingAttachmentUrl,
	removeExistingAttachment,
	onRemoveExistingAttachmentChange,
	error,
	fileError,
	onFileError,
}: BookingFormFieldsProps) {
	const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
				onFileError("File size must not exceed 5MB");
				onChange("attachment", null);
				e.target.value = "";
			} else {
				onFileError(null);
				onChange("attachment", file);
			}
		}
	};

	const handleRemoveFile = () => {
		onChange("attachment", null);
		onFileError(null);
		const fileInput = document.getElementById(
			"booking-attachment",
		) as HTMLInputElement;
		if (fileInput) fileInput.value = "";
	};

	return (
		<div className="space-y-6">
			{error && (
				<div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
					{error}
				</div>
			)}

			{/* Conference Room */}
			<div>
				<label
					htmlFor="room"
					className="block text-sm font-semibold text-gray-900 mb-2"
				>
					Conference Room <span className="text-red-500">*</span>
				</label>
				<Select
					value={values.room}
					onValueChange={(v) => onChange("room", v)}
					required
				>
					<SelectTrigger className="w-full px-4 py-3 bg-gray-50 border-0 text-gray-900">
						<SelectValue placeholder="Select a conference room" />
					</SelectTrigger>
					<SelectContent>
						{CONFERENCE_ROOM_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Date */}
			<div>
				<label
					htmlFor="date"
					className="block text-sm font-semibold text-gray-900 mb-2"
				>
					Date <span className="text-red-500">*</span>
				</label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"w-full px-4 py-3 justify-start text-left font-normal border border-blue-500 hover:bg-gray-50",
								!values.date && "text-muted-foreground",
							)}
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{values.date ? (
								values.date.toLocaleDateString("en-US", {
									month: "long",
									day: "numeric",
									year: "numeric",
								})
							) : (
								<span>Pick a date</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={values.date}
							onSelect={(d) => onChange("date", d)}
							disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
						/>
					</PopoverContent>
				</Popover>
			</div>

			{/* Start/End Time */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label
						htmlFor="startTime"
						className="block text-sm font-semibold text-gray-900 mb-2"
					>
						Start Time <span className="text-red-500">*</span>
					</label>
					<TimePicker
						value={values.startTime}
						onChange={(v) => onChange("startTime", v)}
						placeholder="Select start time"
					/>
				</div>
				<div>
					<label
						htmlFor="endTime"
						className="block text-sm font-semibold text-gray-900 mb-2"
					>
						End Time <span className="text-red-500">*</span>
					</label>
					<TimePicker
						value={values.endTime}
						onChange={(v) => onChange("endTime", v)}
						placeholder="Select end time"
					/>
				</div>
			</div>

			{/* Title */}
			<div>
				<label
					htmlFor="title"
					className="block text-sm font-semibold text-gray-900 mb-2"
				>
					Title <span className="text-red-500">*</span>
				</label>
				<input
					id="title"
					type="text"
					value={values.title}
					onChange={(e) => onChange("title", e.target.value)}
					maxLength={TEXT_LIMITS.XS}
					className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter booking title..."
					required
				/>
				<p className="text-xs text-gray-500 mt-1">
					{values.title.length}/{TEXT_LIMITS.XS} characters
				</p>
			</div>

			{/* Requested For */}
			<div>
				<label
					htmlFor="requestedFor"
					className="block text-sm font-semibold text-gray-900 mb-2"
				>
					Requested For <span className="text-red-500">*</span>
				</label>
				<input
					id="requestedFor"
					type="text"
					value={values.requestedFor}
					onChange={(e) => onChange("requestedFor", e.target.value)}
					maxLength={TEXT_LIMITS.XS}
					className="w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Name of person or group requesting the room..."
					required
				/>
			</div>

			{/* Attachment */}
			<div>
				<label
					htmlFor="booking-attachment"
					className="block text-sm font-semibold text-gray-900 mb-2"
				>
					Attach Letter (Optional)
				</label>

				{/* Existing attachment file card (edit mode) */}
				{existingAttachmentUrl &&
					!removeExistingAttachment &&
					!values.attachment && (
						<div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 mb-3">
							<div className="p-2 rounded-lg bg-gray-100">
								<FileText className="h-5 w-5 text-gray-600" />
							</div>
							<div className="flex flex-col min-w-0 flex-1">
								<span className="text-sm font-medium text-gray-900 truncate">
									{decodeURIComponent(
										(existingAttachmentUrl.split("?")[0] ?? "")
											.split("/")
											.pop() ?? "attachment",
									)}
								</span>
								<span className="text-xs text-gray-500">
									Current attachment
								</span>
							</div>
							{onRemoveExistingAttachmentChange && (
								<button
									type="button"
									onClick={() => setShowRemoveConfirm(true)}
									className="p-2 hover:bg-red-50 rounded-md transition-colors shrink-0 text-gray-400 hover:text-red-600"
									aria-label="Remove attachment"
								>
									<X className="w-4 h-4" />
								</button>
							)}
						</div>
					)}

				{/* Show "removed" notice if marked for removal */}
				{existingAttachmentUrl &&
					removeExistingAttachment &&
					!values.attachment && (
						<div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 mb-3 text-sm text-gray-500">
							<FileText className="h-4 w-4 text-gray-400" />
							<span>Attachment will be removed on save</span>
							{onRemoveExistingAttachmentChange && (
								<button
									type="button"
									onClick={() => onRemoveExistingAttachmentChange(false)}
									className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
								>
									Undo
								</button>
							)}
						</div>
					)}

				{/* File chooser + new file card */}
				<div className="flex items-center gap-2">
					<div className="flex-1 relative">
						<input
							id="booking-attachment"
							type="file"
							accept=".jpg,.jpeg,.pdf"
							onChange={handleFileChange}
							className="hidden"
						/>
						<label
							htmlFor="booking-attachment"
							className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-semibold hover:bg-blue-100 cursor-pointer transition-colors"
						>
							Choose File
						</label>
						{values.attachment && (
							<span className="ml-3 text-sm text-gray-600">
								{values.attachment.name}
							</span>
						)}
					</div>
					{values.attachment && (
						<button
							type="button"
							onClick={handleRemoveFile}
							className="p-2 hover:bg-gray-100 rounded-md transition-colors shrink-0"
							aria-label="Remove file"
						>
							<X className="w-4 h-4 text-gray-500" />
						</button>
					)}
				</div>
				{fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
				<p className="text-xs text-gray-500 mt-1">
					Accepted formats: JPG, PDF (Max size: 5MB)
				</p>
			</div>

			{/* Remove attachment confirmation dialog */}
			<Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Remove Attachment</DialogTitle>
						<DialogDescription>
							Are you sure you want to remove the current attachment? This
							change will take effect when you save.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowRemoveConfirm(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => {
								onRemoveExistingAttachmentChange?.(true);
								setShowRemoveConfirm(false);
							}}
						>
							Remove
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
