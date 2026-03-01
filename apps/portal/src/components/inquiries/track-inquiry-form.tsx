"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	TrackInquiryTicketInput,
	TrackInquiryTicketSchema,
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
	AlertCircle,
	ArrowRight,
	Loader2,
	Phone,
	Ticket,
} from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTrackInquiry } from "@/hooks/inquiries/use-track-inquiry";
import { isCaptchaError } from "@/utils/captcha-utils";
import { CaptchaErrorModal } from "./captcha-error-modal";
import { InquiryFormHeader } from "./form/inquiry-form-header";

interface TrackInquiryFormProps {
	/** Pre-fill reference number from email link */
	prefillRef?: string;
	/** Pre-fill contact number for tracking */
	prefillContact?: string;
}

export function TrackInquiryForm({
	prefillRef,
	prefillContact,
}: TrackInquiryFormProps) {
	const router = useRouter();
	const hasAutoTracked = useRef(false);
	const [captchaErrorModalOpen, setCaptchaErrorModalOpen] = useState(false);
	const [captchaErrorMessage, setCaptchaErrorMessage] = useState("");

	// Use the track inquiry hook for API logic
	const { track, isTracking, error, clearError } = useTrackInquiry({
		onSuccess: (ticketId) => {
			router.push(`/inquiries/${ticketId}`);
		},
	});

	const form = useForm<TrackInquiryTicketInput>({
		resolver: zodResolver(TrackInquiryTicketSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			referenceNumber: prefillRef ?? "",
			citizenContactNumber: prefillContact ?? "",
		},
	});

	// Auto-track when prefill values are provided (from email link)
	useEffect(() => {
		if (prefillRef && prefillContact && !hasAutoTracked.current) {
			hasAutoTracked.current = true;
			track({
				referenceNumber: prefillRef,
				citizenContactNumber: prefillContact,
			});
		}
	}, [prefillRef, prefillContact, track]);

	// Show captcha errors in modal
	useEffect(() => {
		if (error && isCaptchaError(error)) {
			setCaptchaErrorMessage(error);
			setCaptchaErrorModalOpen(true);
			clearError();
		}
	}, [error, clearError]);

	const onSubmit = async (data: TrackInquiryTicketInput) => {
		await track(data);
	};

	// Show loading state when auto-tracking from email link
	const isAutoTracking = prefillRef && prefillContact && isTracking && !error;

	if (isAutoTracking) {
		return (
			<Card className="border-none shadow-lg bg-white rounded-2xl rounded-t-none overflow-hidden mt-0 p-0">
				<InquiryFormHeader>Looking up your inquiry...</InquiryFormHeader>
				<CardContent className="p-12 flex flex-col items-center justify-center gap-4">
					<Loader2 className="h-10 w-10 animate-spin text-[#a60202]" />
					<p className="text-gray-600 text-center">
						Loading your inquiry details for
						<br />
						<span className="font-mono font-semibold text-gray-900">
							{prefillRef}
						</span>
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-none shadow-lg bg-white rounded-2xl rounded-t-none overflow-hidden mt-0 p-0">
			<InquiryFormHeader>
				Enter your ticket details to view progress and updates.
			</InquiryFormHeader>

			<CardContent className="p-8 sm:p-10">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						{error && !isCaptchaError(error) && (
							<div className="bg-red-50 border border-red-100 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
								<AlertCircle className="w-4 h-4" />
								{error}
							</div>
						)}

						<div className="space-y-6">
							<FormField
								control={form.control}
								name="referenceNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-700 font-medium">
											Ticket Reference ID
										</FormLabel>
										<FormControl>
											<div className="relative group">
												<Ticket className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
												<Input
													placeholder="IC26-ABCD1234"
													className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all font-mono"
													{...field}
												/>
											</div>
										</FormControl>
										<p className="text-xs text-gray-500 mt-1.5 ml-1">
											Found in your confirmation email or receipt.
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="citizenContactNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-700 font-medium">
											Contact Number
										</FormLabel>
										<FormControl>
											<div className="relative group">
												<Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
												<Input
													type="tel"
													placeholder="09171234567"
													className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all"
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Button
							type="submit"
							className="w-full h-14 bg-[#a60202] hover:bg-[#8d0202] text-white rounded-xl text-lg font-bold shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
							disabled={isTracking}
						>
							{isTracking ? (
								"Searching..."
							) : (
								<span className="flex items-center gap-2">
									Track Ticket
									<ArrowRight className="w-4 h-4" />
								</span>
							)}
						</Button>
					</form>
				</Form>
			</CardContent>

			<CaptchaErrorModal
				open={captchaErrorModalOpen}
				onOpenChange={setCaptchaErrorModalOpen}
				errorMessage={captchaErrorMessage}
			/>
		</Card>
	);
}
