"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	FILE_UPLOAD_PRESETS,
	INQUIRY_MAX_TOTAL_ATTACHMENTS,
	TEXT_LIMITS,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { formatBytes } from "@repo/ui/components/dropzone";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@repo/ui/components/form";
import { Textarea } from "@repo/ui/components/textarea";
import {
	FileIcon,
	Loader2,
	Paperclip,
	Send,
	X,
} from "@repo/ui/lib/lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFileUpload } from "@/hooks/use-file-upload";

const { maxFiles, maxFileSize, allowedMimeTypes } =
	FILE_UPLOAD_PRESETS.ATTACHMENTS;

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface ReplyBoxProps {
	/** Whether the ticket is closed and replies are disabled */
	isClosed: boolean;
	/** Status label to display when closed (e.g. "resolved", "rejected") */
	closedStatus?: string;
	/** Number of attachment slots already used in the conversation */
	totalAttachments: number;
	/** Called when the user submits a message */
	onSend: (
		content: string,
		files: {
			upload: () => ReturnType<ReturnType<typeof useFileUpload>["onUpload"]>;
		},
	) => Promise<boolean>;
	/** External sending state — set to true while the parent is processing */
	isSending: boolean;
}

/* ------------------------------------------------------------------ */
/*  Schema                                                            */
/* ------------------------------------------------------------------ */

const messageFormSchema = z.object({
	content: z.string().max(TEXT_LIMITS.LG, {
		message: `Message is too long (max ${TEXT_LIMITS.LG} characters).`,
	}),
});

type MessageFormData = z.infer<typeof messageFormSchema>;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ReplyBox({
	isClosed,
	closedStatus,
	totalAttachments,
	onSend,
	isSending,
}: ReplyBoxProps) {
	const messageForm = useForm<MessageFormData>({
		resolver: zodResolver(messageFormSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: { content: "" },
	});

	// Watch content reactively so the send button state updates on every keystroke
	const watchedContent = messageForm.watch("content");

	const remainingAttachmentSlots = Math.max(
		0,
		INQUIRY_MAX_TOTAL_ATTACHMENTS - totalAttachments,
	);
	const effectiveMaxFiles = Math.min(maxFiles, remainingAttachmentSlots);
	const isConversationLimitReached = remainingAttachmentSlots <= 0;

	const {
		files,
		setFiles,
		getRootProps,
		getInputProps,
		isDragActive,
		onUpload,
		isMaxFilesReached,
		isUploading,
		hasFileErrors,
	} = useFileUpload({
		preset: "ATTACHMENTS",
		path: "inquiries",
		maxFiles: effectiveMaxFiles,
		maxFileSize,
		allowedMimeTypes: [...allowedMimeTypes],
	});

	// Derived state
	const hasContent = watchedContent.trim().length > 0;
	const validFiles = files.filter((f) => f.errors.length === 0);
	const hasValidFiles = validFiles.length > 0;
	const canSend =
		!isSending &&
		!isUploading &&
		!hasFileErrors &&
		(hasContent || hasValidFiles);

	const [uploadError, setUploadError] = React.useState<string | null>(null);
	const [sendError, setSendError] = React.useState<string | null>(null);

	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSendMessage = async () => {
		if (!canSend) return;

		setUploadError(null);
		setSendError(null);

		// Validate content if present
		if (hasContent) {
			const isValid = await messageForm.trigger("content");
			if (!isValid) return;
		}

		// If only files but all have errors → bail
		if (!hasContent && !hasValidFiles) {
			setUploadError("Please enter a message or attach valid files.");
			return;
		}

		const success = await onSend(watchedContent.trim(), { upload: onUpload });

		if (success) {
			messageForm.reset();
			setFiles([]);
		}
	};

	/* ---- Closed state ---- */
	if (isClosed) {
		return (
			<div className="p-4 bg-gray-100 border-t text-center text-gray-500 text-sm">
				This ticket has been marked as <strong>{closedStatus}</strong>. You
				cannot send new messages.
			</div>
		);
	}

	return (
		<div className="p-4 bg-white border-t space-y-3">
			{/* Error display */}
			{(sendError || uploadError) && (
				<div className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
					<X className="w-3 h-3" />
					{sendError || uploadError}
				</div>
			)}

			{/* Conversation limit warnings */}
			{isConversationLimitReached ? (
				<div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs">
					This inquiry has reached the maximum of{" "}
					{INQUIRY_MAX_TOTAL_ATTACHMENTS} total attachments. You can still send
					text messages.
				</div>
			) : isMaxFilesReached ? (
				<div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs">
					Maximum {effectiveMaxFiles} file
					{effectiveMaxFiles !== 1 ? "s" : ""} for this message. Remove a file
					to add another. ({remainingAttachmentSlots} remaining for this
					inquiry)
				</div>
			) : null}

			<Form {...messageForm}>
				{/* File list with remove buttons */}
				{files.length > 0 && (
					<div className="flex flex-col gap-2">
						{files.map((f, i) => {
							const hasError = f.errors && f.errors.length > 0;
							return (
								<div
									key={`${f.name}-${i}`}
									className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
										hasError
											? "bg-red-50 border-red-200"
											: "bg-gray-50 border-gray-200"
									}`}
								>
									<FileIcon
										className={`h-4 w-4 shrink-0 ${hasError ? "text-red-500" : "text-gray-500"}`}
									/>
									<div className="flex flex-col min-w-0 flex-1">
										<span className="truncate font-medium">{f.name}</span>
										{hasError ? (
											<span className="text-red-600 text-[11px]">
												{f.errors[0]?.message}
											</span>
										) : (
											<span className="text-gray-400 text-[11px]">
												{formatBytes(f.size, 1)}
											</span>
										)}
									</div>
									<button
										type="button"
										onClick={() => removeFile(i)}
										className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
										title="Remove file"
										disabled={isSending || isUploading}
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</div>
							);
						})}
					</div>
				)}

				{/* Drop zone indicator */}
				{isDragActive && (
					<div className="border-2 border-dashed border-primary bg-primary/10 rounded-lg p-3 text-center text-sm text-primary">
						Drop files here…
					</div>
				)}

				{/* Hidden file input */}
				<input {...getInputProps()} />

				<div className="flex gap-3">
					{/* Attachment button */}
					<div
						className="relative pt-2"
						{...(isConversationLimitReached || isSending || isUploading
							? {}
							: getRootProps())}
					>
						<button
							type="button"
							className={`p-2 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors ${
								isMaxFilesReached ||
								isConversationLimitReached ||
								isSending ||
								isUploading
									? "text-gray-300 cursor-not-allowed"
									: "text-gray-500 cursor-pointer"
							}`}
							title={
								isSending
									? "Sending in progress…"
									: isUploading
										? "Uploading files…"
										: isConversationLimitReached
											? `Maximum ${INQUIRY_MAX_TOTAL_ATTACHMENTS} total attachments reached`
											: isMaxFilesReached
												? `Maximum ${effectiveMaxFiles} files reached`
												: `Attach files (max ${effectiveMaxFiles}, ${formatBytes(maxFileSize)} each)`
							}
							disabled={
								isMaxFilesReached ||
								isConversationLimitReached ||
								isSending ||
								isUploading
							}
						>
							<Paperclip className="h-5 w-5" />
						</button>
					</div>

					{/* Text area */}
					<FormField
						control={messageForm.control}
						name="content"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormControl>
									<Textarea
										{...field}
										placeholder={
											isSending
												? "Sending your message…"
												: isUploading
													? "Uploading files…"
													: "Type your message or attach files…"
										}
										className="min-h-12.5 max-h-37.5 bg-gray-50 border-gray-200 focus:bg-white resize-y"
										disabled={isSending || isUploading}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" &&
												!e.shiftKey &&
												!isSending &&
												!isUploading
											) {
												e.preventDefault();
												handleSendMessage();
											}
										}}
									/>
								</FormControl>
								<FormMessage className="text-xs mt-1" />
							</FormItem>
						)}
					/>

					{/* Send button */}
					<Button
						type="button"
						className="bg-[#a60202] hover:bg-[#8b0202] h-auto px-4 cursor-pointer disabled:cursor-not-allowed"
						disabled={!canSend}
						onClick={handleSendMessage}
					>
						{isSending || isUploading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-4 w-4" />
						)}
					</Button>
				</div>
			</Form>
		</div>
	);
}
