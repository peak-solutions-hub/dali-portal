"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isDefinedError } from "@orpc/client";
import { Card, CardContent } from "@repo/ui/components/card";
import { Form } from "@repo/ui/components/form";
import { Separator } from "@repo/ui/components/separator";
import { AlertCircle } from "@repo/ui/lib/lucide-react";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SuccessDialog } from "@/components/inquiries/success-dialog";
import { api } from "@/lib/api.client";
import { InquiryFormAttachments } from "./form/inquiry-form-attachments";
import { InquiryFormDetails } from "./form/inquiry-form-details";
import { InquiryFormHeader } from "./form/inquiry-form-header";
import { InquiryFormPersonalDetails } from "./form/inquiry-form-personal-details";
import { InquirySecurityCheck } from "./form/inquiry-security-check";
import { InquirySubmitButton } from "./form/inquiry-submit-button";
import {
	SubmitInquiryFormSchema,
	type SubmitInquiryFormValues,
} from "./form/schema";

export function SubmitInquiryForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [referenceNumber, setReferenceNumber] = useState("");
	const [citizenEmail, setCitizenEmail] = useState("");
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

	const form = useForm<SubmitInquiryFormValues>({
		resolver: zodResolver(SubmitInquiryFormSchema),
		defaultValues: {
			citizenName: "",
			citizenEmail: "",
			subject: "",
			message: "",
			category: "general_inquiry",
			captchaToken: null,
		},
	});

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

	const handleTurnstileVerify = (token: string) => {
		setTurnstileToken(token);
		form.setValue("captchaToken", token);
		setError(null);
	};

	const handleTurnstileError = () => {
		setTurnstileToken(null);
		form.setValue("captchaToken", null);
		setError("Security verification failed. Please try again.");
	};

	const handleTurnstileExpire = () => {
		setTurnstileToken(null);
		form.setValue("captchaToken", null);
	};

	const onSubmit = async (data: SubmitInquiryFormValues) => {
		// Check Turnstile token before submitting
		if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
			setError("Please complete the security verification.");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// 1. Upload files
			let attachmentPaths: string[] = [];
			if (uploadedFiles.length > 0) {
				attachmentPaths = await uploadFiles(uploadedFiles);
			}

			// 2. Call API (captchaToken is already in form data)
			const [err, response] = await api.inquiries.create({
				...data,
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
				setCitizenEmail(data.citizenEmail);
				form.reset();
				setUploadedFiles([]);
				setReferenceNumber(response.referenceNumber);
				setSuccessDialogOpen(true);
			}
		} catch (e) {
			console.error(e);
			setError("An unexpected error occurred during submission.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Card className="border-none shadow-lg bg-white rounded-2xl rounded-t-none overflow-hidden mt-0 p-0">
				<InquiryFormHeader>
					Please fill out all required fields marked with an asterisk (*).
				</InquiryFormHeader>

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

							<InquiryFormPersonalDetails control={form.control} />
							<InquiryFormDetails control={form.control} />
							<InquiryFormAttachments
								form={form}
								control={form.control}
								uploadedFiles={uploadedFiles}
								setUploadedFiles={setUploadedFiles}
							/>
							<InquirySecurityCheck
								onVerify={handleTurnstileVerify}
								onError={handleTurnstileError}
								onExpire={handleTurnstileExpire}
							/>

							<Separator className="bg-gray-100" />

							<InquirySubmitButton isSubmitting={isSubmitting} />
						</form>
					</Form>
				</CardContent>
			</Card>

			<SuccessDialog
				open={successDialogOpen}
				onOpenChange={setSuccessDialogOpen}
				referenceNumber={referenceNumber}
				citizenEmail={citizenEmail}
			/>
		</>
	);
}
