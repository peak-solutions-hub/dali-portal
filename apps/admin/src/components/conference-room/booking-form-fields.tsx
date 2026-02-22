"use client";

import {
	CONFERENCE_ROOM_OPTIONS,
	type ConferenceRoom,
	FILE_UPLOAD_PRESETS,
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
import { formatBytes } from "@repo/ui/components/dropzone";
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
import { useSupabaseUpload } from "@repo/ui/hooks/use-supabase-upload";
import { cn } from "@repo/ui/lib/utils";
import {
	AlertCircle,
	CalendarIcon,
	Clock,
	FileText,
	MapPin,
	Paperclip,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";

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
	fieldErrors?: Partial<Record<keyof BookingFormValues, string>>;
	/** Optional room availability metadata used to disable and annotate room options. */
	roomAvailability?: Partial<
		Record<ConferenceRoom, { disabled: boolean; note?: string }>
	>;
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
	fieldErrors,
	roomAvailability,
	existingAttachmentUrl,
	removeExistingAttachment,
	onRemoveExistingAttachmentChange,
	error,
	fileError,
	onFileError,
}: BookingFormFieldsProps) {
	const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
	const { maxFileSize } = FILE_UPLOAD_PRESETS.ATTACHMENTS;

	const {
		files,
		setFiles,
		getRootProps,
		getInputProps,
		isDragActive,
		hasFileErrors,
	} = useSupabaseUpload({
		path: "room-bookings",
		maxFiles: 1,
		maxFileSize: MAX_ATTACHMENT_SIZE_BYTES,
		allowedMimeTypes: ["application/pdf", "image/jpeg", "image/jpg"],
	});

	const selectedRoomLabel =
		CONFERENCE_ROOM_OPTIONS.find((opt) => opt.value === values.room)?.label ??
		"";

	useEffect(() => {
		const validFile = files.find((file) => file.errors.length === 0) ?? null;
		const firstInvalidFile = files.find((file) => file.errors.length > 0);

		if (validFile) {
			if (
				!values.attachment ||
				values.attachment.name !== validFile.name ||
				values.attachment.size !== validFile.size
			) {
				onChange("attachment", validFile);
			}
			onFileError(null);
			return;
		}

		if (firstInvalidFile) {
			onFileError(firstInvalidFile.errors[0]?.message || "Invalid file");
		}

		if (!hasFileErrors) {
			if (values.attachment !== null) {
				onChange("attachment", null);
			}
			onFileError(null);
		}
	}, [files, hasFileErrors, onChange, onFileError, values.attachment]);

	const handleRemoveFile = () => {
		setFiles([]);
		onChange("attachment", null);
		onFileError(null);
	};

	return (
		<div className="space-y-6">
			{error ? null : null}

			{/* Conference Room */}
			<div>
				<label
					htmlFor="room"
					className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2"
				>
					<MapPin className="w-4 h-4 text-gray-500 shrink-0" /> Conference Room{" "}
					<span className="text-red-500">*</span>
				</label>
				<Select
					value={values.room}
					onValueChange={(v) => {
						if (!v) return;
						onChange("room", v);
					}}
				>
					<SelectTrigger
						className={cn(
							"w-full px-4 py-3 bg-gray-50 border-0 text-gray-900 focus:ring-2 focus:ring-[#a60202]/20",
							fieldErrors?.room &&
								"ring-2 ring-red-500/30 border border-red-500 bg-red-50/30",
						)}
					>
						<SelectValue placeholder="Select a conference room">
							{selectedRoomLabel}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{CONFERENCE_ROOM_OPTIONS.map((opt) => {
							const availability = roomAvailability?.[opt.value];
							const note = availability?.note;
							return (
								<SelectItem
									key={opt.value}
									value={opt.value}
									disabled={availability?.disabled}
								>
									<span className="flex items-center gap-2">
										<span>{opt.label}</span>
										{note && (
											<span className="text-xs text-muted-foreground">
												({note})
											</span>
										)}
									</span>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
				{fieldErrors?.room && (
					<p className="text-sm text-red-600 mt-2">{fieldErrors.room}</p>
				)}
			</div>

			{/* Date */}
			<div>
				<label
					htmlFor="date"
					className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2"
				>
					<CalendarIcon className="w-4 h-4 text-gray-500 shrink-0" /> Date{" "}
					<span className="text-red-500">*</span>
				</label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"w-full px-4 py-3 justify-start text-left font-normal border border-blue-500 hover:bg-gray-50 focus:ring-2 focus:ring-[#a60202]/20",
								!values.date && "text-muted-foreground",
								fieldErrors?.date &&
									"ring-2 ring-red-500/30 border-red-500 bg-red-50/30",
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
				{fieldErrors?.date && (
					<p className="text-sm text-red-600 mt-2">{fieldErrors.date}</p>
				)}
			</div>

			{/* Start/End Time */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label
						htmlFor="startTime"
						className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2"
					>
						<Clock className="w-4 h-4 text-gray-500 shrink-0" /> Start Time{" "}
						<span className="text-red-500">*</span>
					</label>
					<TimePicker
						value={values.startTime}
						onChange={(v) => onChange("startTime", v)}
						placeholder="Select start time"
						className={cn(
							"focus:ring-2 focus:ring-[#a60202]/20",
							fieldErrors?.startTime &&
								"ring-2 ring-red-500/30 border-red-500 bg-red-50/30",
						)}
					/>
					{fieldErrors?.startTime && (
						<p className="text-sm text-red-600 mt-2">{fieldErrors.startTime}</p>
					)}
				</div>
				<div>
					<label
						htmlFor="endTime"
						className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 mb-2"
					>
						<Clock className="w-4 h-4 text-gray-500 shrink-0" /> End Time{" "}
						<span className="text-red-500">*</span>
					</label>
					<TimePicker
						value={values.endTime}
						onChange={(v) => onChange("endTime", v)}
						placeholder="Select end time"
						className={cn(
							"focus:ring-2 focus:ring-[#a60202]/20",
							fieldErrors?.endTime &&
								"ring-2 ring-red-500/30 border-red-500 bg-red-50/30",
						)}
					/>
					{fieldErrors?.endTime && (
						<p className="text-sm text-red-600 mt-2">{fieldErrors.endTime}</p>
					)}
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
					className={cn(
						"w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#a60202]/20",
						fieldErrors?.title &&
							"ring-2 ring-red-500/30 border border-red-500 bg-red-50/30",
					)}
					placeholder="Enter booking title..."
				/>
				<p className="text-xs text-gray-500 mt-1">
					{values.title.length}/{TEXT_LIMITS.XS} characters
				</p>
				{fieldErrors?.title && (
					<p className="text-sm text-red-600 mt-2">{fieldErrors.title}</p>
				)}
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
					className={cn(
						"w-full px-4 py-3 bg-gray-50 border-0 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#a60202]/20",
						fieldErrors?.requestedFor &&
							"ring-2 ring-red-500/30 border border-red-500 bg-red-50/30",
					)}
					placeholder="Name of person or group requesting the room..."
				/>
				{fieldErrors?.requestedFor && (
					<p className="text-sm text-red-600 mt-2">
						{fieldErrors.requestedFor}
					</p>
				)}
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

				{isDragActive && (
					<div className="border-2 border-dashed border-primary bg-primary/10 rounded-lg p-3 text-center text-sm text-primary">
						Drop file here...
					</div>
				)}

				<div
					{...getRootProps({
						className:
							"relative border-2 border-dashed rounded-2xl p-6 transition-all text-center bg-gray-50/50 border-gray-300 hover:bg-red-50/10 hover:border-[#a60202]/30 cursor-pointer",
					})}
				>
					<input {...getInputProps()} aria-label="Upload booking attachment" />
					<div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
						<div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-1">
							<Paperclip className="h-6 w-6 text-[#a60202]" />
						</div>
						<p className="text-sm font-medium text-gray-900">
							Click to upload or drag and drop
						</p>
						<p className="text-xs text-gray-500">
							PDF, JPG, JPEG • Max 1 file • {formatBytes(maxFileSize)}
						</p>
					</div>
				</div>

				{files.length > 0 && (
					<div className="grid gap-3 animate-in fade-in slide-in-from-top-1 mt-3">
						{files.map((file, index) => {
							const hasError = file.errors && file.errors.length > 0;
							return (
								<div
									key={`${file.name}-${index}`}
									className={`flex items-center justify-between p-3 rounded-xl border shadow-sm group transition-all ${
										hasError
											? "bg-red-50 border-red-200 hover:border-red-300"
											: "bg-white border-gray-200 hover:border-[#a60202]/30"
									}`}
								>
									<div className="flex items-center gap-3 overflow-hidden">
										<div
											className={`p-2.5 rounded-lg ${
												hasError
													? "bg-red-100 text-red-600"
													: "bg-red-50 text-[#a60202]"
											}`}
										>
											{hasError ? (
												<AlertCircle className="h-4 w-4" />
											) : (
												<FileText className="h-4 w-4" />
											)}
										</div>
										<div className="flex flex-col min-w-0">
											<span
												className={`text-sm font-medium truncate transition-colors ${
													hasError
														? "text-red-700"
														: "text-gray-700 group-hover:text-[#a60202]"
												}`}
											>
												{file.name}
											</span>
											<div className="flex items-center gap-2">
												<span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
													{formatBytes(file.size, 2)}
												</span>
												{hasError && (
													<span className="text-[10px] text-red-600 font-medium">
														{file.errors[0]?.message || "Invalid file"}
													</span>
												)}
											</div>
										</div>
									</div>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											handleRemoveFile();
										}}
										className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all cursor-pointer"
										aria-label={`Remove ${file.name}`}
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							);
						})}
					</div>
				)}

				{fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
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
