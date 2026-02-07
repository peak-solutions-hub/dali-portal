"use client";

import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent } from "@repo/ui/components/card";
import { Form } from "@repo/ui/components/form";
import { Separator } from "@repo/ui/components/separator";
import type { TurnstileWidgetRef } from "@repo/ui/components/turnstile-widget";
import { AlertCircle } from "@repo/ui/lib/lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { SuccessDialog } from "@/components/inquiries/success-dialog";
import { useSendInquiry } from "@/hooks/use-send-inquiry";

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
	const [attachmentPaths, setAttachmentPaths] = useState<string[]>([]);
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [referenceNumber, setReferenceNumber] = useState("");
	const [citizenEmail, setCitizenEmail] = useState("");
	const turnstileRef = useRef<TurnstileWidgetRef>(null);

	// Use the send inquiry hook for API logic
	const { submit, isSubmitting, error, clearError } = useSendInquiry({
		onSuccess: (refNumber) => {
			setReferenceNumber(refNumber);
			setSuccessDialogOpen(true);
		},
	});

	const form = useForm<SubmitInquiryFormValues>({
		resolver: zodResolver(SubmitInquiryFormSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			citizenName: "",
			citizenEmail: "",
			subject: "",
			message: "",
			category: "general_inquiry",
			captchaToken: null,
		},
	});

	const handleTurnstileVerify = (token: string) => {
		form.setValue("captchaToken", token);
		clearError();
	};

	const handleTurnstileError = () => {
		form.setValue("captchaToken", null);
	};

	const handleTurnstileExpire = () => {
		form.setValue("captchaToken", null);
	};

	const onSubmit = async (data: SubmitInquiryFormValues) => {
		const captchaToken = turnstileRef.current?.getToken();

		// Check Turnstile token before submitting
		if (!captchaToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
			return;
		}

		// 1. Upload files via hook (if any files selected)
		// @ts-expect-error - Runtime property set by child component
		const uploadFn = form._uploadFiles;
		let uploadedPaths: string[] = attachmentPaths;

		if (uploadFn && typeof uploadFn === "function") {
			const result = await uploadFn();

			if (result.errors && result.errors.length > 0) {
				turnstileRef.current?.reset();
				return;
			}

			if (result.successes && result.successes.length > 0) {
				uploadedPaths = result.successes.map((s: { path: string }) => s.path);
			}
		}

		// 2. Submit via hook
		const { success } = await submit(
			{
				...data,
				captchaToken: captchaToken ?? "",
			},
			uploadedPaths,
		);

		if (success) {
			setCitizenEmail(data.citizenEmail);
			form.reset();
			setAttachmentPaths([]);
			turnstileRef.current?.reset();
		} else {
			turnstileRef.current?.reset();
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
								onUploadComplete={(paths) => setAttachmentPaths(paths)}
							/>
							<InquirySecurityCheck
								ref={turnstileRef}
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
