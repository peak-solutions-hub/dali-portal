import { InquiryTabs } from "@/components/inquiries/inquiry-tabs";

export default function InquiriesPage() {
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
						<InquiryTabs />
					</div>
				</div>
			</div>
		</div>
	);
}
