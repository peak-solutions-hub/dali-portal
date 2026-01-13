"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isDefinedError } from "@orpc/client";
import type { TrackInquiryTicketInput } from "@repo/shared";
import { TrackInquiryTicketSchema } from "@repo/shared";
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
import { Mail, Ticket } from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api.client";

export function TrackInquiryForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<TrackInquiryTicketInput>({
		resolver: zodResolver(TrackInquiryTicketSchema),
		defaultValues: {
			referenceNumber: "",
			citizenEmail: "",
		},
	});

	const onSubmit = async (data: TrackInquiryTicketInput) => {
		setIsSubmitting(true);
		setError(null);

		const [err, response] = await api.inquiries.track(data);

		if (err) {
			setError(
				isDefinedError(err)
					? err.message
					: "Failed to track inquiry. Please check your details and try again.",
			);
			setIsSubmitting(false);
			return;
		}

		if (response?.id) {
			// Redirect to inquiry detail page
			router.push(`/inquiries/${response.id}`);
		} else {
			setError(
				"No inquiry found with these details. Please check and try again.",
			);
		}

		setIsSubmitting(false);
	};

	return (
		<Card className="border-none shadow-md border-l-4 border-l-[#a60202]">
			<CardContent className="p-8 sm:p-10">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
								{error}
							</div>
						)}

						<FormField
							control={form.control}
							name="referenceNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-gray-900">Ticket ID *</FormLabel>
									<FormControl>
										<div className="relative">
											<Ticket className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
											<Input
												placeholder="IC-XXXXXXXXXX"
												className="pl-10 bg-[#f9fafb] border-gray-200 focus:bg-white focus:border-[#a60202] transition-all h-12 text-base"
												{...field}
											/>
										</div>
									</FormControl>
									<p className="text-sm text-gray-500 mt-2">
										This was provided when you submitted your inquiry
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="citizenEmail"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-gray-900">
										Email Address *
									</FormLabel>
									<FormControl>
										<div className="relative">
											<Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
											<Input
												placeholder="your.email@example.com"
												type="email"
												className="pl-10 bg-[#f9fafb] border-gray-200 focus:bg-white focus:border-[#a60202] transition-all h-12 text-base"
												{...field}
											/>
										</div>
									</FormControl>
									<p className="text-sm text-gray-500 mt-2">
										Use the same email you used when submitting the inquiry
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className="w-full bg-[#a60202] hover:bg-[#8b0202] text-white h-12 text-base font-medium shadow-lg shadow-red-900/20"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Tracking..." : "Track Inquiry"}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
