import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ChevronLeft } from "@repo/ui/lib/lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentHeader, PDFViewer } from "@/components/legislative-documents/";
import { fetchLegislativeDocument } from "@/lib/legislative-documents/data";

interface PageProps {
	params: Promise<{
		id: string;
	}>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;
	const document = await fetchLegislativeDocument(id);

	if (!document) {
		return {
			title: "Document Not Found",
			description: "The requested legislative document could not be found.",
		};
	}

	const documentTitle =
		document.displayTitle || document.document?.title || "Untitled Document";
	const documentType = document.displayType || "Legislative Document";
	const classification = document.displayClassification || "";
	const series = `Series of ${document.series_year}`;

	const description = `${documentType} - ${documentTitle}. ${series}. ${classification ? `Classification: ${classification}.` : ""} Official Number: ${document.official_number}.`;

	return {
		title: `${document.official_number} - ${documentTitle}`,
		description: description.substring(0, 160), // Limit to 160 chars for SEO
		openGraph: {
			title: `${document.official_number} - ${documentTitle}`,
			description: description,
			type: "article",
			publishedTime: document.date_enacted,
			url: `/legislative-documents/${id}`,
		},
		twitter: {
			card: "summary_large_image",
			title: `${document.official_number} - ${documentTitle}`,
			description: description.substring(0, 160),
		},
	};
}

export default async function DocumentDetailPage({ params }: PageProps) {
	const { id } = await params;
	const document = await fetchLegislativeDocument(id);

	if (!document) {
		notFound();
	}

	const documentTitle =
		document.displayTitle || document.document?.title || "Untitled Document";
	const pdfUrl = document.pdfUrl!;

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Back Button */}
			<div className="bg-white border-b border-gray-200">
				<div className="container mx-auto px-4 py-4">
					<Link href="/legislative-documents">
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2"
						>
							<ChevronLeft className="h-4 w-4" />
							Back to Documents
						</Button>
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-8">
				<Card className="p-4 sm:p-6 md:p-8">
					<div className="space-y-6">
						{/* Document Header with Metadata */}
						<DocumentHeader document={document} />

						{/* PDF Viewer */}
						<PDFViewer
							documentId={id}
							pdfUrl={pdfUrl}
							documentTitle={documentTitle}
						/>
					</div>
				</Card>
			</div>
		</div>
	);
}
