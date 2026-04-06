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
import { useEffect, useRef } from "react";

export interface BookingAttachmentDraft {
	file: File;
	reason: string;
}

function getFileIdentity(file: File): string {
	return `${file.name}:${file.size}:${file.lastModified}`;
}

function isAttachmentLimitMessage(message: string | null): boolean {
	if (!message) {
		return false;
	}

	const normalized = message.toLowerCase();
	return (
		normalized.includes("maximum") ||
		normalized.includes("attachments reached") ||
		normalized.includes("upload up to") ||
		normalized.includes("too many files")
	);
}

export interface BookingFormValues {
	room: string;
	date: Date | undefined;
	startTime: string;
	endTime: string;
	meetingType: string;
	meetingTypeOthers: string;
	title: string;
	requestedFor: string;
	attachments: BookingAttachmentDraft[];
}

interface BookingFormFieldsProps {
	values: BookingFormValues;
	onChange: (field: keyof BookingFormValues, value: unknown) => void;
	fieldErrors?: Partial<Record<keyof BookingFormValues, string>>;
	selectedRoomConflictNote?: string | null;
	roomAvailability?: Partial<
		Record<ConferenceRoom, { disabled: boolean; note?: string }>
	>;
	existingAttachments?: Array<{
		path: string;
		url: string | null;
		fileName: string;
		reason?: string | null;
	}>;
	removedExistingAttachmentPaths?: string[];
	onToggleExistingAttachmentRemoval?: (path: string) => void;
	onExistingAttachmentReasonChange?: (path: string, reason: string) => void;
	error?: string | null;
	fileError: string | null;
	onFileError: (msg: string | null) => void;
	isUploadingAttachment?: boolean;
	uploadProgress?: number | null;
	uploadedAttachmentCount?: number;
	totalAttachmentCount?: number;
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
	onExistingAttachmentReasonChange,
	error,
	fileError,
	onFileError,
	isUploadingAttachment = false,
	uploadProgress = null,
	uploadedAttachmentCount = 0,
	totalAttachmentCount = 0,
}: BookingFormFieldsProps) {
	const { maxFileSize, maxFiles, allowedMimeTypes } =
		FILE_UPLOAD_PRESETS.ATTACHMENTS;
	const existingCount =
		existingAttachments?.filter(
			(attachment) =>
				!(removedExistingAttachmentPaths ?? []).includes(attachment.path),
		).length ?? 0;
	const remainingAttachmentSlots = Math.max(maxFiles - existingCount, 0);
	const uploadMaxFiles = Math.max(remainingAttachmentSlots, 1);
	const hasReachedAttachmentLimit = remainingAttachmentSlots === 0;

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

	const { files, setFiles, getRootProps, getInputProps, isDragActive } =
		useSupabaseUpload({
			path: "room-bookings",
			maxFiles: uploadMaxFiles,
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
		if (hasReachedAttachmentLimit) {
			if (files.length > 0) {
				setFiles([]);
			}
			if (values.attachments.length > 0) {
				onChange("attachments", []);
			}
			onFileError(
				`Maximum of ${maxFiles} attachments reached. Remove at least one existing attachment to add new files.`,
			);
			return;
		}

		if (fileError && isAttachmentLimitMessage(fileError)) {
			onFileError(null);
		}

		const validFiles = files.filter((file) => file.errors.length === 0);
		const firstInvalidFile = files.find((file) => file.errors.length > 0);
		const acceptedFiles = validFiles.slice(0, remainingAttachmentSlots);
		const exceedsRemainingSlots = validFiles.length > remainingAttachmentSlots;

		if (exceedsRemainingSlots) {
			setFiles(acceptedFiles);
			onFileError(`Maximum of ${maxFiles} attachments is allowed.`);
			return;
		}

		if (acceptedFiles.length > 0) {
			const reasonByIdentity = new Map(
				values.attachments.map((attachment) => [
					getFileIdentity(attachment.file),
					attachment.reason,
				]),
			);
			const nextAttachments: BookingAttachmentDraft[] = acceptedFiles.map(
				(file) => ({
					file: file as File,
					reason: reasonByIdentity.get(getFileIdentity(file as File)) ?? "",
				}),
			);

			if (
				values.attachments.length !== nextAttachments.length ||
				values.attachments.some((existing, index) => {
					const next = nextAttachments[index];
					return (
						!next ||
						existing.file.name !== next.file.name ||
						existing.file.size !== next.file.size ||
						existing.file.lastModified !== next.file.lastModified ||
						existing.reason !== next.reason
					);
				})
			) {
				onChange("attachments", nextAttachments);
			}
			onFileError(null);
			return;
		}

		if (firstInvalidFile) {
			onFileError(firstInvalidFile.errors[0]?.message || "Invalid file");
			return;
		}

		if (values.attachments.length > 0) {
			onChange("attachments", []);
		}
		onFileError(null);
	}, [
		fileError,
		files,
		hasReachedAttachmentLimit,
		maxFiles,
		onChange,
		onFileError,
		remainingAttachmentSlots,
		setFiles,
		values.attachments,
	]);

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

	const handleRemoveFile = (indexToRemove: number) => {
		const nextFiles = files.filter((_, index) => index !== indexToRemove);
		setFiles(nextFiles);

		const nextAttachments = nextFiles
			.filter((file) => file.errors.length === 0)
			.map((file) => {
				const existing = values.attachments.find(
					(attachment) =>
						getFileIdentity(attachment.file) === getFileIdentity(file as File),
				);

				return {
					file: file as File,
					reason: existing?.reason ?? "",
				};
			});

		onChange("attachments", nextAttachments);
		onFileError(null);
	};

	const handleAttachmentReasonChange = (file: File, reason: string) => {
		const targetIdentity = getFileIdentity(file);
		const next = values.attachments.map((attachment) =>
			getFileIdentity(attachment.file) === targetIdentity
				? { ...attachment, reason }
				: attachment,
		);
		onChange("attachments", next);
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
					<PopoverContent
						className="w-auto max-h-[calc(100dvh-3rem)] overflow-y-auto p-0"
						align="start"
					>
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

			<div ref={meetingTypeErrorRef}>
				<label
					htmlFor="meetingType"
					className="block text-sm font-semibold text-gray-900 mb-2"
				>
					Meeting Type <span className="text-red-500">*</span>
				</label>
				<div className="rounded-md border border-gray-200 bg-gray-50/60 p-3 space-y-2">
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

					{values.meetingType === "others" && (
						<div ref={meetingTypeOthersErrorRef} className="space-y-1">
							<label
								htmlFor="meetingTypeOthers"
								className="text-xs font-medium text-gray-600"
							>
								Other, please specify <span className="text-red-500">*</span>
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
								placeholder="Type custom meeting type..."
							/>
							<p className="text-[11px] text-gray-500">
								Use this when your meeting type is not listed above.
							</p>
							{fieldErrors?.meetingTypeOthers && (
								<p className="text-sm text-red-600">
									{fieldErrors.meetingTypeOthers}
								</p>
							)}
						</div>
					)}
				</div>
				{fieldErrors?.meetingType && (
					<p className="text-sm text-red-600 mt-2">{fieldErrors.meetingType}</p>
				)}
			</div>

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
										"rounded-lg border p-3",
										isMarked
											? "border-dashed border-gray-300 bg-gray-50 text-gray-500"
											: "border-gray-200 bg-white",
									)}
								>
									<div className="flex items-start gap-3">
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
									{onExistingAttachmentReasonChange && (
										<div className="mt-2">
											<label
												htmlFor={`existing-attachment-reason-${attachment.path}`}
												className="block text-[11px] font-medium text-gray-500 mb-1"
											>
												Reason for attachment (optional)
											</label>
											<input
												id={`existing-attachment-reason-${attachment.path}`}
												type="text"
												value={attachment.reason ?? ""}
												onChange={(event) =>
													onExistingAttachmentReasonChange(
														attachment.path,
														event.target.value,
													)
												}
												maxLength={TEXT_LIMITS.XS}
												disabled={isMarked}
												className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:outline-none focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20 disabled:opacity-70"
												placeholder="Example: Signed request memo from department head"
											/>
										</div>
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
					{...(hasReachedAttachmentLimit
						? {}
						: getRootProps({
								className:
									"relative border-2 border-dashed rounded-2xl p-6 transition-all text-center bg-gray-50/50 border-gray-300 hover:bg-red-50/10 hover:border-[#a60202]/30 cursor-pointer",
							}))}
					className={cn(
						"relative border-2 border-dashed rounded-2xl p-6 transition-all text-center",
						hasReachedAttachmentLimit
							? "bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed"
							: "bg-gray-50/50 border-gray-300 hover:bg-red-50/10 hover:border-[#a60202]/30 cursor-pointer",
					)}
				>
					<input
						{...getInputProps({ disabled: hasReachedAttachmentLimit })}
						aria-label="Upload booking attachment"
					/>
					<div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
						<div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-1">
							<Paperclip className="h-6 w-6 text-[#a60202]" />
						</div>
						<p className="text-sm font-medium text-gray-900">
							Click to upload or drag and drop
						</p>
						<p className="text-xs text-gray-500">
							PDF, DOC, DOCX, JPG, JPEG, PNG • Max {maxFiles} files total •{" "}
							{formatBytes(maxFileSize)}
						</p>
						{!hasReachedAttachmentLimit && existingAttachments && (
							<p className="text-xs text-gray-500">
								You can add up to {remainingAttachmentSlots} more file
								{remainingAttachmentSlots === 1 ? "" : "s"}.
							</p>
						)}
						{hasReachedAttachmentLimit && (
							<p className="text-xs text-amber-700">
								Maximum attachments reached. Remove at least one existing file
								to add another.
							</p>
						)}
					</div>
				</div>

				{isUploadingAttachment && (
					<div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
						<p className="text-sm font-medium text-blue-800">
							Uploading attachment(s)
							{totalAttachmentCount > 0
								? ` ${Math.min(uploadedAttachmentCount, totalAttachmentCount)}/${totalAttachmentCount}`
								: ""}
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
							const draftAttachment = values.attachments.find(
								(attachment) =>
									getFileIdentity(attachment.file) ===
									getFileIdentity(file as File),
							);

							return (
								<div
									key={`${file.name}-${index}`}
									className={`max-w-full overflow-hidden p-3 rounded-xl border shadow-sm group transition-all ${
										hasError
											? "bg-red-50 border-red-200 hover:border-red-300"
											: "bg-white border-gray-200 hover:border-[#a60202]/30"
									}`}
								>
									<div className="flex min-w-0 items-center gap-3 overflow-hidden max-w-full">
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
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												handleRemoveFile(index);
											}}
											className="shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all cursor-pointer"
											aria-label={`Remove ${file.name}`}
										>
											<X className="h-4 w-4" />
										</button>
									</div>
									{!hasError && (
										<div className="mt-2 pl-12">
											<label
												htmlFor={`attachment-reason-${index}`}
												className="block text-[11px] font-medium text-gray-500 mb-1"
											>
												Reason for attachment (optional)
											</label>
											<input
												id={`attachment-reason-${index}`}
												type="text"
												value={draftAttachment?.reason ?? ""}
												onChange={(event) =>
													handleAttachmentReasonChange(
														file as File,
														event.target.value,
													)
												}
												maxLength={TEXT_LIMITS.XS}
												className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:outline-none focus:border-[#a60202] focus:ring-2 focus:ring-[#a60202]/20"
												placeholder="Example: Agenda, endorsement, or supporting document"
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}

				{fieldErrors?.attachments && (
					<p className="text-sm text-red-600 mt-2">{fieldErrors.attachments}</p>
				)}
				{fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
			</div>
		</div>
	);
}
