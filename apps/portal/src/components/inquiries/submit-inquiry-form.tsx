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
import { Textarea } from "@repo/ui/components/textarea";
import { Mail, Paperclip, Phone, User, X } from "@repo/ui/lib/lucide-react";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api.client";

// Extend schema to include contact number (optional) and files
const SubmitInquiryFormSchema = CreateInquiryTicketSchema.extend({
	contactNumber: z.string().optional(),
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
	const [uploadProgress, setUploadProgress] = useState<number>(0);

	const form = useForm<SubmitInquiryFormValues>({
		resolver: zodResolver(SubmitInquiryFormSchema),
		defaultValues: {
			citizenName: "",
			contactNumber: "",
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
		setUploadProgress(10); // Start progress

		try {
			// 1. Upload files
			let attachmentPaths: string[] = [];
			if (uploadedFiles.length > 0) {
				setUploadProgress(30);
				attachmentPaths = await uploadFiles(uploadedFiles);
				setUploadProgress(60);
			}

			// 2. Prepare payload
			const { contactNumber, ...apiData } = data;

			// Append contact number to message if provided
			let finalMessage = apiData.message;
			if (contactNumber) {
				finalMessage += `\n\nContact Number: ${contactNumber}`;
			}

			// 3. Call API
			const [err, response] = await api.inquiries.create({
				...apiData,
				message: finalMessage,
				attachmentPaths:
					attachmentPaths.length > 0 ? attachmentPaths : undefined,
			});

			setUploadProgress(90);

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
				setUploadProgress(100);
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
			setUploadProgress(0);
		}
	};

	const formatCategoryLabel = (category: string) => {
		return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
	};

	return (
		<Card className="border-none shadow-md border-l-4 border-l-[#a60202]">
			<CardContent className="p-8 sm:p-10">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-xl text-sm font-medium">
								{error}
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<FormField
								control={form.control}
								name="citizenName"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-900 font-semibold mb-2 block">
											Full Name *
										</FormLabel>
										<FormControl>
											<div className="relative group">
												<User className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
												<Input
													className="pl-10 h-12 bg-[#f9fafb] border-gray-200 focus:bg-white focus:border-[#a60202] transition-all"
													placeholder="Juan Dela Cruz"
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="contactNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-900 font-semibold mb-2 block">
											Contact Number (Optional)
										</FormLabel>
										<FormControl>
											<div className="relative group">
												<Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
												<Input
													className="pl-10 h-12 bg-[#f9fafb] border-gray-200 focus:bg-white focus:border-[#a60202] transition-all"
													placeholder="0912 345 6789"
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<FormField
								control={form.control}
								name="citizenEmail"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-900 font-semibold mb-2 block">
											Email Address *
										</FormLabel>
										<FormControl>
											<div className="relative group">
												<Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
												<Input
													type="email"
													className="pl-10 h-12 bg-[#f9fafb] border-gray-200 focus:bg-white focus:border-[#a60202] transition-all"
													placeholder="juan@example.com"
													{...field}
												/>
											</div>
										</FormControl>
										<p className="text-[10px] text-gray-500 mt-2 font-medium">
											Ticket details will be sent here.
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-900 font-semibold mb-2 block">
											Category *
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger className="h-12 bg-[#f9fafb] border-gray-200 focus:bg-white focus:ring-[#a60202]">
													<SelectValue placeholder="Select a category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{INQUIRY_CATEGORY_VALUES.map((category) => (
													<SelectItem key={category} value={category}>
														{formatCategoryLabel(category)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="subject"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-gray-900 font-semibold mb-2 block">
										Subject *
									</FormLabel>
									<FormControl>
										<Input
											className="h-12 bg-[#f9fafb] border-gray-200 focus:bg-white focus:border-[#a60202] transition-all"
											placeholder="Brief summary of your inquiry"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-gray-900 font-semibold mb-2 block">
										Message *
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Please describe your inquiry in detail..."
											className="min-h-[150px] bg-[#f9fafb] border-gray-200 focus:bg-white focus:border-[#a60202] transition-all resize-y"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormItem>
							<FormLabel className="text-gray-900 font-semibold mb-2 block">
								Attachments (Optional)
							</FormLabel>
							<FormControl>
								<div className="space-y-4">
									<div className="flex items-center gap-4">
										<Input
											type="file"
											multiple // Allow multiple files selection
											accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
											className="bg-[#f9fafb] border-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#a60202]/10 file:text-[#a60202] hover:file:bg-[#a60202]/20 cursor-pointer h-12 pt-2"
											onChange={handleFileChange}
										/>
										<span className="text-xs text-gray-500 font-medium whitespace-nowrap">
											Max {MAX_FILES} files, 50MB each
										</span>
									</div>

									{uploadedFiles.length > 0 && (
										<div className="grid gap-2">
											{uploadedFiles.map((file, index) => (
												<div
													key={index}
													className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
												>
													<div className="flex items-center gap-3 overflow-hidden">
														<div className="bg-gray-100 p-2 rounded-lg">
															<Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
														</div>
														<div className="flex flex-col min-w-0">
															<span className="text-sm font-medium text-gray-900 truncate">
																{file.name}
															</span>
															<span className="text-[10px] text-gray-400 font-bold uppercase">
																{(file.size / 1024 / 1024).toFixed(2)} MB
															</span>
														</div>
													</div>
													<button
														type="button"
														onClick={() => removeFile(index)}
														className="text-gray-400 hover:text-[#a60202] hover:bg-red-50 p-2 rounded-full transition-all"
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

						<div className="bg-[#f9fafb] p-4 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-gray-200 border-dashed font-medium">
							CAPTCHA Placeholder (Turnstile)
						</div>

						<Button
							type="submit"
							className="w-full h-14 bg-[#a60202] hover:bg-[#8b0202] text-white rounded-xl text-lg font-bold shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<span className="flex items-center gap-2">
									Processing... {uploadProgress > 0 && `(${uploadProgress}%)`}
								</span>
							) : (
								"Submit Inquiry"
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
