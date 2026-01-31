"use client";

import { FILE_UPLOAD_PRESETS } from "@repo/shared";
import { formatBytes } from "@repo/ui/components/dropzone";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { useSupabaseUpload } from "@repo/ui/hooks/use-supabase-upload";
import { AlertCircle, FileIcon, Paperclip, X } from "@repo/ui/lib/lucide-react";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useEffect, useRef } from "react";
import type { Control, UseFormReturn } from "react-hook-form";
import type { SubmitInquiryFormValues } from "./schema";

interface InquiryFormAttachmentsProps {
	form: UseFormReturn<SubmitInquiryFormValues>;
	control: Control<SubmitInquiryFormValues>;
	onUploadComplete?: (paths: string[]) => void;
}

const { maxFiles, maxFileSize, allowedMimeTypes } =
	FILE_UPLOAD_PRESETS.ATTACHMENTS;

export function InquiryFormAttachments({
	form,
	control,
	onUploadComplete,
}: InquiryFormAttachmentsProps) {
	const supabase = createSupabaseBrowserClient();

	// File upload hook with Supabase integration
	const {
		files,
		setFiles,
		getRootProps,
		getInputProps,
		isDragActive,
		onUpload,
		errors,
		hasFileErrors,
		isMaxFilesReached,
	} = useSupabaseUpload({
		supabaseClient: supabase,
		bucketName: "attachments",
		path: "inquiries",
		maxFiles,
		maxFileSize,
		allowedMimeTypes: [...allowedMimeTypes],
		onUploadSuccess: (paths) => {
			onUploadComplete?.(paths);
			form.clearErrors("files");
		},
		onUploadError: (uploadErrors) => {
			form.setError("files", {
				type: "manual",
				message: uploadErrors[0]?.message || "Upload failed",
			});
		},
	});

	// Track previous error state to detect when errors are cleared
	const prevHasErrors = useRef(hasFileErrors);

	// Sync file validation errors to form (onChange validation)
	useEffect(() => {
		// Check if errors were just cleared (files removed to within limit)
		const errorsJustCleared = prevHasErrors.current && !hasFileErrors;
		prevHasErrors.current = hasFileErrors;

		if (hasFileErrors) {
			// Find first file with error to display
			const errorFile = files.find((f) => f.errors && f.errors.length > 0);
			form.setError("files", {
				type: "manual",
				message: errorFile?.errors?.[0]?.message || "Invalid file",
			});
		} else if (errors.length > 0) {
			// Check for upload errors
			form.setError("files", {
				type: "manual",
				message: errors[0]?.message || "Upload failed",
			});
		} else if (errorsJustCleared || files.length > 0) {
			// Clear errors if files are now valid or errors were just cleared
			form.clearErrors("files");
		}
	}, [files, errors, hasFileErrors, form]);

	const removeFile = (index: number) => {
		setFiles((prev) => {
			const newFiles = prev.filter((_, i) => i !== index);
			// Clear form errors if no files left
			if (newFiles.length === 0) {
				form.clearErrors("files");
			}
			return newFiles;
		});
	};

	// Expose onUpload to parent via ref or callback
	useEffect(() => {
		// Store upload function in form context for parent component
		// @ts-expect-error - Adding runtime property for parent component
		form._uploadFiles = onUpload;
	}, [onUpload, form]);

	return (
		<div className="space-y-6 pt-2">
			<div className="flex items-center gap-2 text-gray-900 font-semibold text-lg pb-2 border-b border-gray-100">
				<span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-[#a60202] text-xs font-bold ring-4 ring-white">
					3
				</span>
				Attachments
			</div>

			<FormField
				control={control}
				name="files"
				render={() => (
					<FormItem>
						<FormLabel className="text-gray-700 font-medium group flex items-center justify-between">
							<span>Supporting Documents (Optional)</span>
							<span className="text-xs text-gray-400 font-normal bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
								Max {maxFiles} files, {formatBytes(maxFileSize)} each
							</span>
						</FormLabel>
						<FormDescription className="text-xs text-gray-500">
							Accepted formats: PDF, DOC, DOCX, JPG, PNG
						</FormDescription>
						<FormControl>
							<div className="space-y-4">
								{/* Drop zone indicator */}
								{isDragActive && (
									<div className="border-2 border-dashed border-primary bg-primary/10 rounded-lg p-3 text-center text-sm text-primary">
										Drop files here...
									</div>
								)}

								{/* Max files warning */}
								{isMaxFilesReached && (
									<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-medium flex items-start gap-2">
										<AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
										<p>
											Maximum of {maxFiles} files reached. Remove a file to add
											more.
										</p>
									</div>
								)}

								{/* Dropzone area */}
								<div
									{...getRootProps({
										className: `relative border-2 border-dashed rounded-2xl p-8 transition-all text-center ${
											isMaxFilesReached
												? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
												: "bg-gray-50/50 border-gray-300 hover:bg-red-50/10 hover:border-[#a60202]/30 cursor-pointer"
										} ${isDragActive ? "border-primary bg-primary/10" : ""}`,
									})}
								>
									<input
										{...getInputProps()}
										disabled={isMaxFilesReached}
										aria-label="Upload supporting documents"
									/>
									<div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
										<div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-1">
											<Paperclip className="h-6 w-6 text-[#a60202]" />
										</div>
										<p className="text-sm font-medium text-gray-900">
											{isMaxFilesReached
												? `Maximum ${maxFiles} files reached`
												: "Click to upload or drag and drop"}
										</p>
										<p className="text-xs text-gray-500">
											PDF, DOC, DOCX, JPG, PNG • Max {formatBytes(maxFileSize)}{" "}
											each
										</p>
									</div>
								</div>

								{/* File list */}
								{files.length > 0 && (
									<div className="grid gap-3 animate-in fade-in slide-in-from-top-1">
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
																<FileIcon className="h-4 w-4" />
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
															removeFile(index);
														}}
														className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
														aria-label={`Remove ${file.name}`}
													>
														<X className="h-4 w-4" />
													</button>
												</div>
											);
										})}
									</div>
								)}
								<FormMessage>
									{form.formState.errors.files?.message}
								</FormMessage>
							</div>
						</FormControl>
					</FormItem>
				)}
			/>
		</div>
	);
}
