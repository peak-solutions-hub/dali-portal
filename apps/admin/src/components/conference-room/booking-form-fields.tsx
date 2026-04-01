"use client";

import {
	CONFERENCE_ROOM_OPTIONS,
	type ConferenceRoom,
	FILE_UPLOAD_PRESETS,
	MEETING_TYPE_OPTIONS,
	TEXT_LIMITS,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
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
import { useEffect, useRef, useState } from "react";

export interface BookingFormValues {
	room: string;
	date: Date | undefined;
	startTime: string;
	endTime: string;
	meetingType: string;
	meetingTypeOthers: string;
	title: string;
	requestedFor: string;
	attachments: File[];
}

interface BookingFormFieldsProps {
	values: BookingFormValues;
	onChange: (field: keyof BookingFormValues, value: unknown) => void;
	fieldErrors?: Partial<Record<keyof BookingFormValues, string>>;
	selectedRoomConflictNote?: string | null;
	/** Optional room availability metadata used to disable and annotate room options. */
	roomAvailability?: Partial<
		Record<ConferenceRoom, { disabled: boolean; note?: string }>
	>;
	/** Existing attachments persisted on the booking (edit mode). */
	existingAttachments?: Array<{
		path: string;
		url: string | null;
		fileName: string;
	}>;
	/** Paths of existing attachments marked for removal (edit mode). */
	removedExistingAttachmentPaths?: string[];
	/** Toggle remove marker for a specific existing attachment path (edit mode). */
	onToggleExistingAttachmentRemoval?: (path: string) => void;
	/** Form-level error message displayed at the top. */
	error?: string | null;
	/** File validation error. */
	fileError: string | null;
	onFileError: (msg: string | null) => void;
	isUploadingAttachment?: boolean;
	uploadProgress?: number | null;
}

export function BookingFormFields({
	values,
	onChange,
	fieldErrors,
	selectedRoomConflictNote,
	roomAvailability,
	existingAttachments,
	removedExistingAttachmentPaths,
	onToggleExistingAttachmentRemoval,
	error,
	fileError,
	onFileError,
	isUploadingAttachment = false,
	uploadProgress = null,
}: BookingFormFieldsProps) {
	const { maxFileSize, maxFiles, allowedMimeTypes } =
		FILE_UPLOAD_PRESETS.ATTACHMENTS;
	const formErrorRef = useRef<HTMLDivElement | null>(null);
	const roomErrorRef = useRef<HTMLDivElement | null>(null);
	const dateErrorRef = useRef<HTMLDivElement | null>(null);
	const startTimeErrorRef = useRef<HTMLDivElement | null>(null);
	const endTimeErrorRef = useRef<HTMLDivElement | null>(null);
	const meetingTypeErrorRef = useRef<HTMLDivElement | null>(null);
	const meetingTypeOthersErrorRef = useRef<HTMLDivElement | null>(null);
	const titleErrorRef = useRef<HTMLDivElement | null>(null);
	const requestedForErrorRef = useRef<HTMLDivElement | null>(null);
	const fileErrorRef = useRef<HTMLDivElement | null>(null);

	const {
		files,
		setFiles,
		getRootProps,
		getInputProps,
		isDragActive,
		hasFileErrors,
	} = useSupabaseUpload({
		path: "room-bookings",
		maxFiles,
		maxFileSize,
		allowedMimeTypes: [...allowedMimeTypes],
	});

	const selectedRoomLabel =
		CONFERENCE_ROOM_OPTIONS.find((opt) => opt.value === values.room)?.label ??
		"";
	const allRoomsBooked =
		CONFERENCE_ROOM_OPTIONS.length > 0 &&
		CONFERENCE_ROOM_OPTIONS.every(
			(option) => roomAvailability?.[option.value]?.disabled === true,
		);

	useEffect(() => {
		const validFiles = files.filter((file) => file.errors.length === 0);
		const firstInvalidFile = files.find((file) => file.errors.length > 0);

		if (validFiles.length > 0) {
			if (
				values.attachments.length !== validFiles.length ||
				values.attachments.some(
					(existing, index) =>
						existing.name !== validFiles[index]?.name ||
						existing.size !== validFiles[index]?.size,
				)
			) {
				onChange(
					"attachments",
					validFiles.map((file) => file as File),
				);
			}
			onFileError(null);
			return;
		}

		if (firstInvalidFile) {
			onFileError(firstInvalidFile.errors[0]?.message || "Invalid file");
		}

		if (!hasFileErrors) {
			if (values.attachments.length > 0) {
				onChange("attachments", []);
			}
			onFileError(null);
		}
	}, [files, hasFileErrors, onChange, onFileError, values.attachments]);

	useEffect(() => {
		let target: HTMLElement | null = null;

		if (error) {
			target = formErrorRef.current;
		} else if (fieldErrors?.room) {
			target = roomErrorRef.current;
		} else if (fieldErrors?.date) {
			target = dateErrorRef.current;
		} else if (fieldErrors?.startTime) {
			target = startTimeErrorRef.current;
		} else if (fieldErrors?.endTime) {
			target = endTimeErrorRef.current;
		} else if (fieldErrors?.meetingType) {
			target = meetingTypeErrorRef.current;
		} else if (fieldErrors?.meetingTypeOthers) {
			target = meetingTypeOthersErrorRef.current;
		} else if (fieldErrors?.title) {
			target = titleErrorRef.current;
		} else if (fieldErrors?.requestedFor) {
			target = requestedForErrorRef.current;
		} else if (selectedRoomConflictNote) {
			target = roomErrorRef.current;
		} else if (fileError) {
			target = fileErrorRef.current;
		}

		if (!target) {
			return;
		}

		requestAnimationFrame(() => {
			target?.scrollIntoView({ behavior: "smooth", block: "center" });
		});
	}, [error, fieldErrors, fileError, selectedRoomConflictNote]);

	const handleRemoveFile = (name: string, size: number) => {
		const nextFiles = files.filter(
			(file) => !(file.name === name && file.size === size),
		);
		setFiles(nextFiles);
		onChange(
			"attachments",
			nextFiles
				.filter((file) => file.errors.length === 0)
				.map((file) => file as File),
		);
		onFileError(null);
	};

	return (
		<div className="space-y-6">
			{error && (
				<div
					ref={formErrorRef}
					className="rounded-md border border-red-200 bg-red-50 px-4 py-3"
				>
					<p className="text-sm text-red-700">{error}</p>
				</div>
			)}

			{/* Conference Room */}
			<div ref={roomErrorRef}>
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
							"w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 shadow-sm focus:ring-2 focus:ring-[#a60202]/20 focus:border-[#a60202] transition-colors",
							fieldErrors?.room && "border-red-500 ring-2 ring-red-500/20",
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
				{selectedRoomConflictNote && !fieldErrors?.room && (
					<p className="text-sm text-red-700 mt-2">
						This room is occupied for the selected schedule:{" "}
						{selectedRoomConflictNote}
					</p>
				)}
				{allRoomsBooked && !fieldErrors?.room && (
					<p className="text-sm text-amber-700 mt-2" role="status">
						All conference rooms are currently occupied for this date and time.
					</p>
				)}
			</div>

			{/* Date */}
			<div ref={dateErrorRef}>
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
								"w-full px-4 py-3 justify-start text-left font-normal border border-gray-300 shadow-sm hover:bg-gray-50 focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20 transition-colors",
								!values.date && "text-muted-foreground",
								fieldErrors?.date && "border-red-500 ring-2 ring-red-500/20",
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
				<div ref={startTimeErrorRef}>
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
						minTime="08:00"
						maxTime="17:00"
						className={cn(
							"bg-white border border-gray-300 shadow-sm focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20 transition-colors",
							fieldErrors?.startTime && "border-red-500 ring-2 ring-red-500/20",
						)}
					/>
					{fieldErrors?.startTime && (
						<p className="text-sm text-red-600 mt-2">{fieldErrors.startTime}</p>
					)}
				</div>
				<div ref={endTimeErrorRef}>
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
						minTime={values.startTime || "08:00"}
						maxTime="17:00"
						className={cn(
							"bg-white border border-gray-300 shadow-sm focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20 transition-colors",
							fieldErrors?.endTime && "border-red-500 ring-2 ring-red-500/20",
						)}
					/>
					{fieldErrors?.endTime && (
						<p className="text-sm text-red-600 mt-2">{fieldErrors.endTime}</p>
					)}
				</div>
			</div>

			{/* Meeting Type */}
			<div ref={meetingTypeErrorRef}>
				<label
					htmlFor="meetingType"
					className="block text-sm font-semibold text-gray-900 mb-2"
				>
					Meeting Type <span className="text-red-500">*</span>
				</label>
				<Select
					value={values.meetingType}
					onValueChange={(v) => {
						if (!v) return;
						onChange("meetingType", v);
						if (v !== "others") {
							onChange("meetingTypeOthers", "");
						}
					}}
				>
					<SelectTrigger
						className={cn(
							"w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 shadow-sm focus:ring-2 focus:ring-[#a60202]/20 focus:border-[#a60202] transition-colors",
							fieldErrors?.meetingType &&
								"border-red-500 ring-2 ring-red-500/20",
						)}
					>
						<SelectValue placeholder="Select meeting type" />
					</SelectTrigger>
					<SelectContent>
						{MEETING_TYPE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{fieldErrors?.meetingType && (
					<p className="text-sm text-red-600 mt-2">{fieldErrors.meetingType}</p>
				)}
			</div>

			{values.meetingType === "others" && (
				<div ref={meetingTypeOthersErrorRef}>
					<label
						htmlFor="meetingTypeOthers"
						className="block text-sm font-semibold text-gray-900 mb-2"
					>
						Please specify <span className="text-red-500">*</span>
					</label>
					<input
						id="meetingTypeOthers"
						type="text"
						value={values.meetingTypeOthers}
						onChange={(e) => onChange("meetingTypeOthers", e.target.value)}
						maxLength={TEXT_LIMITS.SM}
						className={cn(
							"w-full px-4 py-3 bg-white border border-gray-300 shadow-sm rounded-md text-gray-900 focus:outline-none focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20 transition-colors",
							fieldErrors?.meetingTypeOthers &&
								"border-red-500 ring-2 ring-red-500/20",
						)}
						placeholder="Specify meeting type..."
					/>
					{fieldErrors?.meetingTypeOthers && (
						<p className="text-sm text-red-600 mt-2">
							{fieldErrors.meetingTypeOthers}
						</p>
					)}
				</div>
			)}

			{/* Title */}
			<div ref={titleErrorRef}>
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
						"w-full px-4 py-3 bg-white border border-gray-300 shadow-sm rounded-md text-gray-900 focus:outline-none focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20 transition-colors",
						fieldErrors?.title && "border-red-500 ring-2 ring-red-500/20",
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
			<div ref={requestedForErrorRef}>
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
						"w-full px-4 py-3 bg-white border border-gray-300 shadow-sm rounded-md text-gray-900 focus:outline-none focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20 transition-colors",
						fieldErrors?.requestedFor &&
							"border-red-500 ring-2 ring-red-500/20",
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
			<div ref={fileErrorRef}>
				<label
					htmlFor="booking-attachment"
					className="block text-sm font-semibold text-gray-900 mb-2"
				>
					Attach Letter (Optional)
				</label>

				{(existingAttachments?.length ?? 0) > 0 && (
					<div className="space-y-2 mb-3">
						<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
							Current Attachments
						</p>
						{existingAttachments?.map((attachment) => {
							const isMarked =
								removedExistingAttachmentPaths?.includes(attachment.path) ??
								false;

							return (
								<div
									key={attachment.path}
									className={cn(
										"flex items-center gap-3 p-3 rounded-lg border",
										isMarked
											? "border-dashed border-gray-300 bg-gray-50 text-gray-500"
											: "border-gray-200 bg-white",
									)}
								>
									<div className="p-2 rounded-lg bg-gray-100">
										<FileText className="h-5 w-5 text-gray-600" />
									</div>
									<div className="flex flex-col min-w-0 flex-1 max-w-full overflow-hidden">
										<span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">
											{attachment.fileName}
										</span>
										<span className="text-xs">
											{isMarked
												? "Will be removed on save"
												: "Saved attachment"}
										</span>
									</div>
									{onToggleExistingAttachmentRemoval && (
										<button
											type="button"
											onClick={() =>
												onToggleExistingAttachmentRemoval(attachment.path)
											}
											className={cn(
												"p-2 rounded-md transition-colors shrink-0",
												isMarked
													? "text-blue-600 hover:bg-blue-50"
													: "text-gray-400 hover:bg-red-50 hover:text-red-600",
											)}
											aria-label={
												isMarked
													? "Undo remove attachment"
													: "Remove attachment"
											}
										>
											<X className="w-4 h-4" />
										</button>
									)}
								</div>
							);
						})}
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
							PDF, DOC, DOCX, JPG, JPEG, PNG • Max {maxFiles} files •{" "}
							{formatBytes(maxFileSize)}
						</p>
					</div>
				</div>

				{isUploadingAttachment && (
					<div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
						<p className="text-sm font-medium text-blue-800">
							Uploading attachment
							{uploadProgress !== null ? ` (${uploadProgress}%)` : "..."}
						</p>
						<div className="mt-2 h-2 w-full rounded-full bg-blue-100">
							<div
								className="h-2 rounded-full bg-blue-600 transition-all"
								style={{ width: `${uploadProgress ?? 0}%` }}
							/>
						</div>
					</div>
				)}

				{files.length > 0 && (
					<div className="grid gap-3 animate-in fade-in slide-in-from-top-1 mt-3">
						{files.map((file, index) => {
							const hasError = file.errors && file.errors.length > 0;
							return (
								<div
									key={`${file.name}-${index}`}
									className={`flex max-w-full items-center gap-2 overflow-hidden p-3 rounded-xl border shadow-sm group transition-all ${
										hasError
											? "bg-red-50 border-red-200 hover:border-red-300"
											: "bg-white border-gray-200 hover:border-[#a60202]/30"
									}`}
								>
									<div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden max-w-full">
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
										<div className="flex flex-col min-w-0 flex-1 max-w-full overflow-hidden">
											<span
												className={`text-sm font-medium truncate transition-colors ${
													hasError
														? "text-red-700"
														: "text-gray-700 group-hover:text-[#a60202]"
												}`}
												title={file.name}
											>
												{file.name}
											</span>
											<div className="flex min-w-0 items-center gap-2">
												<span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
													{formatBytes(file.size, 2)}
												</span>
												{hasError && (
													<span className="truncate text-[10px] text-red-600 font-medium">
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
											handleRemoveFile(file.name, file.size);
										}}
										className="shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all cursor-pointer"
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
		</div>
	);
}
