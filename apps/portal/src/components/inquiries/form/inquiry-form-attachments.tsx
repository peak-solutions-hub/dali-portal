"use client";

import { FILE_COUNT_LIMITS, FILE_SIZE_LIMITS } from "@repo/shared";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { FileText, Paperclip, X } from "@repo/ui/lib/lucide-react";
import type { Control, UseFormReturn } from "react-hook-form";
import type { SubmitInquiryFormValues } from "./schema";

interface InquiryFormAttachmentsProps {
	form: UseFormReturn<SubmitInquiryFormValues>; // Need full form for errors
	control: Control<SubmitInquiryFormValues>;
	uploadedFiles: File[];
	setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export function InquiryFormAttachments({
	form,
	control,
	uploadedFiles,
	setUploadedFiles,
}: InquiryFormAttachmentsProps) {
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files);
			const totalFiles = uploadedFiles.length + newFiles.length;

			if (totalFiles > FILE_COUNT_LIMITS.MD) {
				form.setError("files", {
					type: "manual",
					message: `You can only upload a maximum of ${FILE_COUNT_LIMITS.MD} files.`,
				});
				return;
			}

			const invalidFiles = newFiles.filter(
				(file) => file.size > FILE_COUNT_LIMITS.MD,
			);
			if (invalidFiles.length > 0) {
				form.setError("files", {
					type: "manual",
					message: "Some files exceed the 50MB limit.",
				});
				return;
			}

			form.clearErrors("files");
			setUploadedFiles((prev) => [...prev, ...newFiles]);
		}
	};

	const removeFile = (index: number) => {
		setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
	};

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
				name="files" // Virtual field for validation
				render={() => (
					<FormItem>
						<FormLabel className="text-gray-700 font-medium group flex items-center justify-between">
							<span>Supporting Documents (Optional)</span>
							<span className="text-xs text-gray-400 font-normal bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
								Max {FILE_SIZE_LIMITS.LG} files, 50MB each
							</span>
						</FormLabel>
						<FormControl>
							<div className="space-y-4">
								<div
									className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center
                        ${
													uploadedFiles.length >= FILE_COUNT_LIMITS.MD
														? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
														: "bg-gray-50/50 border-gray-300 hover:bg-red-50/10 hover:border-[#a60202]/30 cursor-pointer"
												}`}
								>
									<Input
										type="file"
										multiple
										accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
										onChange={handleFileChange}
										disabled={uploadedFiles.length >= FILE_COUNT_LIMITS.MD}
									/>
									<div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
										<div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-1">
											<Paperclip className="h-6 w-6 text-[#a60202]" />
										</div>
										<p className="text-sm font-medium text-gray-900">
											Click to upload or drag and drop
										</p>
										<p className="text-xs text-gray-500">
											Supported: PDF, DOC, JPG, PNG
										</p>
									</div>
								</div>

								{uploadedFiles.length > 0 && (
									<div className="grid gap-3 animate-in fade-in slide-in-from-top-1">
										{uploadedFiles.map((file, index) => (
											<div
												key={index}
												className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 shadow-sm group hover:border-[#a60202]/30 transition-all"
											>
												<div className="flex items-center gap-3 overflow-hidden">
													<div className="bg-red-50 p-2.5 rounded-lg text-[#a60202]">
														<FileText className="h-4 w-4" />
													</div>
													<div className="flex flex-col min-w-0">
														<span className="text-sm font-medium text-gray-700 truncate group-hover:text-[#a60202] transition-colors">
															{file.name}
														</span>
														<span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
															{(file.size / 1024 / 1024).toFixed(2)} MB
														</span>
													</div>
												</div>
												<button
													type="button"
													onClick={() => removeFile(index)}
													className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
												>
													<X className="h-4 w-4" />
												</button>
											</div>
										))}
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
