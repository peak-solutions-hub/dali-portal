import { InquiryTabs } from "@/components/inquiries/inquiry-tabs";

type PageProps = {
	searchParams: Promise<{
		tab?: string;
		// for auto filling the track form if user clicks through from email
		ref?: string;
		email?: string;
	}>;
};

export default async function InquiriesPage({ searchParams }: PageProps) {
	const params = await searchParams;

	// If ref and email are provided (from email link), auto-switch to track tab
	const activeTab = params.ref && params.email ? "track" : params.tab;

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
							Welcome to the Vice Mayor Office&apos;s digital assistance portal.
							Whether you have a concern, want to set an appointment, or need to
							follow up on a document request, we&apos;re here to help.
						</p>
					</div>
					{/* Tabs & Form Section */}
					<div className="relative">
						<InquiryTabs
							activeTab={activeTab}
							prefillRef={params.ref}
							prefillEmail={params.email}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
