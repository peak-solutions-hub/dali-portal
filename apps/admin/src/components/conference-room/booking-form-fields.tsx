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
import { CalendarIcon, X } from "lucide-react";

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

	const canToggleExistingAttachment =
		Boolean(existingAttachmentUrl) && !values.attachment;

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
					{existingAttachmentUrl && !values.attachment && (
						<span className="ml-2 text-xs text-gray-400 font-normal">
							{removeExistingAttachment
								? "(current file will be removed when saved)"
								: "(current file will be kept unless changed)"}
						</span>
					)}
				</label>
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
				{canToggleExistingAttachment && onRemoveExistingAttachmentChange && (
					<button
						type="button"
						onClick={() =>
							onRemoveExistingAttachmentChange(!removeExistingAttachment)
						}
						className="mt-2 text-sm text-blue-700 hover:text-blue-800 underline"
					>
						{removeExistingAttachment
							? "Keep current attachment"
							: "Remove current attachment"}
					</button>
				)}
				{fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
				<p className="text-xs text-gray-500 mt-1">
					Accepted formats: JPG, PDF (Max size: 5MB)
				</p>
			</div>
		</div>
	);
}
