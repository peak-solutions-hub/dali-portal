import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { SubmitInquiryForm } from "@/components/inquiries/submit-inquiry-form";
import { TrackInquiryForm } from "@/components/inquiries/track-inquiry-form";

export default function InquiriesPage() {
	return (
		<div className="min-h-screen bg-gray-50 pt-32 pb-12">
			<div className="container mx-auto px-6 max-w-7xl">
				<div className="mb-8">
					<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-playfair-display">
						Citizen Inquiry Help Desk
					</h1>
					<p className="text-gray-600 text-sm max-w-2xl">
						Submit a new inquiry to the Vice Mayor&apos;s Office or track the
						status of an existing ticket.
					</p>
				</div>

				<div className="max-w-4xl mx-auto">
					<Tabs defaultValue="submit" className="w-full">
						<TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1 bg-gray-100/80 rounded-xl shadow-sm border border-gray-200">
							<TabsTrigger
								value="submit"
								className="py-3 text-base rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#a60202] data-[state=active]:shadow-md transition-all font-medium"
							>
								Submit New Inquiry
							</TabsTrigger>
							<TabsTrigger
								value="track"
								className="py-3 text-base rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#a60202] data-[state=active]:shadow-md transition-all font-medium"
							>
								Track Status
							</TabsTrigger>
						</TabsList>

						<TabsContent
							value="submit"
							className="focus-visible:outline-none focus-visible:ring-0"
						>
							<SubmitInquiryForm />
						</TabsContent>

						<TabsContent
							value="track"
							className="focus-visible:outline-none focus-visible:ring-0"
						>
							<TrackInquiryForm />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
