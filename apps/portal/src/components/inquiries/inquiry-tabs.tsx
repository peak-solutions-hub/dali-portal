"use client";

import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { SubmitInquiryForm } from "@/components/inquiries/submit-inquiry-form";
import { TrackInquiryForm } from "@/components/inquiries/track-inquiry-form";

interface InquiryTabsProps {
	activeTab?: string;
}

export function InquiryTabs({ activeTab = "submit" }: InquiryTabsProps) {
	return (
		<Tabs defaultValue={activeTab} className="w-full relative">
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
					<SubmitInquiryForm />
				</TabsContent>

				<TabsContent
					value="track"
					className="focus-visible:outline-none focus-visible:ring-0 mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 rounded-t-none"
				>
					<TrackInquiryForm />
				</TabsContent>
			</div>
		</Tabs>
	);
}
