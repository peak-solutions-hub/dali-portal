import { isDefinedError } from "@orpc/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InquiryDetails } from "@/components/inquiries/inquiry-details";
import { api } from "@/lib/api.client";

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;

	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) {
		return {
			title: "Invalid Inquiry",
			robots: { index: false, follow: false },
		};
	}

	const [error, data] = await api.inquiries.getWithMessages({ id });

	if (error || !data) {
		return {
			title: "Inquiry Not Found",
			description: "The requested inquiry could not be found.",
			robots: { index: false, follow: false },
		};
	}

	return {
		title: `Inquiry #${data.referenceNumber}`,
		description: `Inquiry ticket #${data.referenceNumber} — ${data.category}.`,
		robots: { index: false, follow: false },
	};
}

export default async function InquiryPage({ params }: PageProps) {
	const { id } = await params;

	// Fetch inquiry with messages - signed URLs are now included in the response
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
