import { isDefinedError } from "@orpc/client";
import { notFound } from "next/navigation";
import { InquiryDetails } from "@/components/inquiries/inquiry-details";
import { api } from "@/lib/api.client";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function InquiryPage({ params }: PageProps) {
	const { id } = await params;

	const [err, data] = await api.inquiries.getWithMessages({ id });

	if (err) {
		if (isDefinedError(err) && err.status === 404) {
			notFound();
		}

		return (
			<div className="min-h-screen bg-gray-50 pt-32 pb-12">
				<div className="container mx-auto px-6 max-w-7xl">
					<div className="bg-red-50 p-8 rounded-lg border border-red-100 text-center max-w-2xl mx-auto shadow-sm">
						<h1 className="text-xl font-bold text-red-800 mb-2">
							Error Loading Inquiry
						</h1>
						<p className="text-red-600 mb-6">
							Unable to retrieve the requested inquiry ticket.
						</p>
						<p className="text-xs text-red-400 font-mono bg-white p-2 rounded">
							Error: {err.message}
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Ensure we have a valid ticket
	if (!data) return notFound();

	return (
		<div className="min-h-screen bg-gray-50/50 pb-24">
			<div className="pt-8">
				<InquiryDetails data={data} />
			</div>
		</div>
	);
}
