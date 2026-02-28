import type { Metadata } from "next";
import { InquiryTabs } from "@/components/inquiries/inquiry-tabs";

export const metadata: Metadata = {
	title: "Submit an Inquiry",
	description:
		"Submit a concern, request an appointment, or follow up on a document request with the Iloilo City Vice Mayor's Office.",
	openGraph: {
		url: "/inquiries",
	},
};

type PageProps = {
	searchParams: Promise<{
		tab?: string;
		// for auto filling the track form if user clicks through from email
		ref?: string;
		contact?: string;
	}>;
};

export default async function InquiriesPage({ searchParams }: PageProps) {
	const params = await searchParams;

	// If ref and contact are provided (from email link), auto-switch to track tab
	const activeTab = params.ref && params.contact ? "track" : params.tab;

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
							Welcome to the Sangguniang Panlungsod ng Iloilo digital portal;
							for concerns, appointments, or document follow-ups, the Office of
							the Vice Mayor is here to assist you.
						</p>
					</div>
					{/* Tabs & Form Section */}
					<div className="relative">
						<InquiryTabs
							activeTab={activeTab}
							prefillRef={params.ref}
							prefillContact={params.contact}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
