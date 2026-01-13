"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isDefinedError } from "@orpc/client";
import {
	CreateInquiryTicketSchema,
	INQUIRY_CATEGORY_VALUES,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Separator } from "@repo/ui/components/separator";
import { Textarea } from "@repo/ui/components/textarea";
import {
	AlertCircle,
	CheckCircle2,
	FileText,
	Mail,
	Paperclip,
	Send,
	User,
	X,
} from "@repo/ui/lib/lucide-react";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api.client";

const SubmitInquiryFormSchema = CreateInquiryTicketSchema.extend({
	// Native File objects for upload handling, not sent to API
	files: z.custom<FileList>().optional(),
});

type SubmitInquiryFormValues = z.infer<typeof SubmitInquiryFormSchema>;

interface SubmitInquiryFormProps {
	onSuccess?: (referenceNumber: string) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 5;

export function SubmitInquiryForm({ onSuccess }: SubmitInquiryFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

	const form = useForm<SubmitInquiryFormValues>({
		resolver: zodResolver(SubmitInquiryFormSchema),
		defaultValues: {
			citizenName: "",
			citizenEmail: "",
			subject: "",
			message: "",
			category: "general_inquiry",
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files);
			const totalFiles = uploadedFiles.length + newFiles.length;

			if (totalFiles > MAX_FILES) {
				form.setError("files", {
					type: "manual",
					message: `You can only upload a maximum of ${MAX_FILES} files.`,
				});
				return;
			}

			const invalidFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);
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

	const uploadFiles = async (files: File[]): Promise<string[]> => {
		const supabase = createSupabaseBrowserClient();
		const paths: string[] = [];

		for (const file of files) {
			const fileExt = file.name.split(".").pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `inquiries/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from("attachments") // Ensure this bucket exists in Supabase
				.upload(filePath, file);

			if (uploadError) {
				console.error("Upload error:", uploadError);
				throw new Error(`Failed to upload ${file.name}`);
			}

			paths.push(filePath);
		}
		return paths;
	};

	const onSubmit = async (data: SubmitInquiryFormValues) => {
		setIsSubmitting(true);
		setError(null);

		try {
			// 1. Upload files
			let attachmentPaths: string[] = [];
			if (uploadedFiles.length > 0) {
				attachmentPaths = await uploadFiles(uploadedFiles);
			}

			// 2. Prepare payload
			const { ...apiData } = data;

			// 3. Call API
			const [err, response] = await api.inquiries.create({
				...apiData,
				message: apiData.message,
				attachmentPaths:
					attachmentPaths.length > 0 ? attachmentPaths : undefined,
			});

			if (err) {
				let errorMessage = "Failed to submit inquiry. Please try again.";
				if (isDefinedError(err)) {
					errorMessage = (err as { message: string }).message;
				} else if (err instanceof Error) {
					errorMessage = (err as Error).message;
				}
				setError(errorMessage);
				setIsSubmitting(false);
				return;
			}

			if (response?.referenceNumber) {
				form.reset();
				setUploadedFiles([]);
				if (onSuccess) {
					onSuccess(response.referenceNumber);
				} else {
					// Fallback success UI if no handler
					alert(
						`Inquiry submitted! Reference Number: ${response.referenceNumber}`,
					);
				}
			}
		} catch (e) {
			console.error(e);
			setError("An unexpected error occurred during submission.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatCategoryLabel = (category: string) => {
		return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
	};

	return (
		<Card className="border-none shadow-lg bg-white rounded-2xl rounded-t-none overflow-hidden mt-0 p-0">
			<div className="bg-[#a60202] py-3 px-6 sm:px-8">
				<p className="text-white/90 text-sm font-medium">
					Please fill out all required fields marked with an asterisk (*).
				</p>
			</div>

			<CardContent className="px-6 sm:px-8 py-8">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						{error && (
							<div className="bg-red-50 border border-red-100 text-red-800 px-4 py-4 rounded-xl text-sm font-medium flex items-start gap-3">
								<AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
								<div>
									<p className="font-bold text-red-900">Submission Failed</p>
									<p>{error}</p>
								</div>
							</div>
						)}

						{/* Personal Information Section */}
						<div className="space-y-6">
							<div className="flex items-center gap-2 text-gray-900 font-semibold text-lg pb-2 border-b border-gray-100">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-[#a60202] text-xs font-bold ring-4 ring-white">
									1
								</span>
								Personal Details
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<FormField
									control={form.control}
									name="citizenName"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-gray-700 font-medium">
												Full Name <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<div className="relative group">
													<User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
													<Input
														className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all"
														placeholder="e.g. Juan Dela Cruz"
														{...field}
													/>
												</div>
											</FormControl>
											<FormDescription className="text-xs text-gray-500 mt-1.5 ml-1 select-none opacity-0">
												This is a placeholder to align the height.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="citizenEmail"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-gray-700 font-medium">
												Email Address <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<div className="relative group">
													<Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
													<Input
														type="email"
														className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all"
														placeholder="e.g. juan@example.com"
														{...field}
													/>
												</div>
											</FormControl>
											<FormDescription className="text-xs text-gray-500 mt-1.5 ml-1">
												We'll send the ticket reference and updates here.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Inquiry Details Section */}
						<div className="space-y-6 pt-2">
							<div className="flex items-center gap-2 text-gray-900 font-semibold text-lg pb-2 border-b border-gray-100">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-[#a60202] text-xs font-bold ring-4 ring-white">
									2
								</span>
								Inquiry Details
							</div>

							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<FormField
										control={form.control}
										name="category"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-gray-700 font-medium">
													Category <span className="text-red-500">*</span>
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl">
															<SelectValue placeholder="Select a category" />
														</SelectTrigger>
													</FormControl>
													<SelectContent className="rounded-xl border-gray-100 shadow-lg">
														{INQUIRY_CATEGORY_VALUES.map((category) => (
															<SelectItem
																key={category}
																value={category}
																className="py-3 px-4 focus:bg-red-50 focus:text-[#a60202] cursor-pointer"
															>
																{formatCategoryLabel(category)}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="subject"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-gray-700 font-medium">
													Subject <span className="text-red-500">*</span>
												</FormLabel>
												<FormControl>
													<Input
														className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all"
														placeholder="Brief summary (e.g. Schedule Request)"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="message"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-gray-700 font-medium">
												Message <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Please describe your inquiry, concern, or request in detail..."
													className="min-h-[160px] bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl resize-y p-4 leading-relaxed"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Attachments Section */}
						<div className="space-y-6 pt-2">
							<div className="flex items-center gap-2 text-gray-900 font-semibold text-lg pb-2 border-b border-gray-100">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-[#a60202] text-xs font-bold ring-4 ring-white">
									3
								</span>
								Attachments
							</div>

							<FormField
								control={form.control}
								name="files" // Virtual field for validation
								render={() => (
									<FormItem>
										<FormLabel className="text-gray-700 font-medium group flex items-center justify-between">
											<span>Supporting Documents (Optional)</span>
											<span className="text-xs text-gray-400 font-normal bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
												Max {MAX_FILES} files, 50MB each
											</span>
										</FormLabel>
										<FormControl>
											<div className="space-y-4">
												<div
													className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center
                            ${
															uploadedFiles.length >= MAX_FILES
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
														disabled={uploadedFiles.length >= MAX_FILES}
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

						{/* Bot Protection Placeholder */}
						<div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-1">
							<p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
								Security Check
							</p>
							<p className="text-sm text-gray-400">
								Cloudflare Turnstile CAPTCHA will appear here
							</p>
						</div>

						<Separator className="bg-gray-100" />

						<div className="flex justify-end pt-2">
							<Button
								type="submit"
								className="w-full sm:w-auto min-w-50 h-14 bg-[#a60202] hover:bg-[#8b0202] text-white rounded-xl text-base font-bold shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<span className="flex items-center gap-2">
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Submitting
									</span>
								) : (
									<span className="flex items-center gap-2">
										Submit Inquiry
										<Send className="w-4 h-4" />
									</span>
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
