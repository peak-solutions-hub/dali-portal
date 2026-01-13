"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { useState } from "react";
import { SubmitInquiryForm } from "@/components/inquiries/submit-inquiry-form";
import { SuccessDialog } from "@/components/inquiries/success-dialog";
import { TrackInquiryForm } from "@/components/inquiries/track-inquiry-form";

export default function InquiriesPage() {
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [referenceNumber, setReferenceNumber] = useState("");

	const handleSubmitSuccess = (refNumber: string) => {
		setReferenceNumber(refNumber);
		setSuccessDialogOpen(true);
	};

	return (
		<div className="min-h-screen bg-gray-50/50 pb-24">
			<div className="container mx-auto px-6 py-8 max-w-7xl">
				<div className="space-y-6">
					{/* Header Section */}
					<div>
						<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-playfair-display">
							Citizen Inquiry Help Desk
						</h1>
						<p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
							Welcome to the Vice Mayor&apos;s digital assistance portal.
							Whether you have a concern, suggestion, or need to follow up on an
							existing request, we&apos;re here to help.
						</p>
					</div>

					{/* Tabs & Form Section */}
					<div className="relative">
						<Tabs defaultValue="submit" className="w-full">
							<div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm py-4 -mx-6 px-6 sm:mx-0 sm:px-0 transition-all">
								<TabsList className="sticky grid w-full grid-cols-2 p-1 bg-white rounded-xl shadow-sm border border-gray-200 h-14">
									<TabsTrigger
										value="submit"
										className="h-full text-base font-medium rounded-lg data-[state=active]:bg-[#a60202] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
									>
										New Inquiry
									</TabsTrigger>
									<TabsTrigger
										value="track"
										className="h-full text-base font-medium rounded-lg data-[state=active]:bg-[#a60202] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
									>
										Track Status
									</TabsTrigger>
								</TabsList>
							</div>

							<div className="mt-0">
								<TabsContent
									value="submit"
									className="focus-visible:outline-none focus-visible:ring-0 mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 rounded-t-none"
								>
									<SubmitInquiryForm onSuccess={handleSubmitSuccess} />
								</TabsContent>

								<TabsContent
									value="track"
									className="focus-visible:outline-none focus-visible:ring-0 mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 rounded-t-none"
								>
									<TrackInquiryForm />
								</TabsContent>
							</div>
						</Tabs>
					</div>
				</div>
			</div>

			<SuccessDialog
				open={successDialogOpen}
				onOpenChange={setSuccessDialogOpen}
				referenceNumber={referenceNumber}
			/>
		</div>
	);
}
