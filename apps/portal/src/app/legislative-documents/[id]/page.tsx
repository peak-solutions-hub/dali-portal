import { isDefinedError } from "@orpc/client";
import { getClassificationLabel, transformDocumentDates } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ChevronLeft } from "@repo/ui/lib/lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentHeader, PDFViewer } from "@/components/legislative-documents/";
import { api } from "@/lib/api.client";

interface PageProps {
	params: Promise<{
		id: string;
	}>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;

	// Validate numeric id
	const idNum = Number(id);
	if (!Number.isFinite(idNum) || idNum <= 0) {
		return {
			title: "Invalid Document",
			description: "Invalid document ID.",
		};
	}

	const [error, documentData] = await api.legislativeDocuments.getById({
		id: idNum,
	});

	if (error || !documentData) {
		return {
			title: "Document Not Found",
			description: "The requested legislative document could not be found.",
		};
	}

	// Transform date strings to Date objects
	const document = transformDocumentDates(documentData);

	const documentTitle =
		document.displayTitle || document.document?.title || "Untitled Document";
	const documentType = document.displayType || "Legislative Document";
	const classification = document.displayClassification
		? getClassificationLabel(document.displayClassification)
		: "";
	const series = `Series of ${document.seriesYear}`;

	const description = `${documentType} - ${documentTitle}. ${series}. ${classification ? `Classification: ${classification}.` : ""} Official Number: ${document.officialNumber}.`;

	return {
		title: `${document.officialNumber} - ${documentTitle}`,
		description: description.substring(0, 160), // Limit to 160 chars for SEO
		openGraph: {
			title: `${document.officialNumber} - ${documentTitle}`,
			description: description,
			type: "article",
			publishedTime: document.dateEnacted.toISOString(),
			url: `/legislative-documents/${id}`,
		},
		twitter: {
			card: "summary_large_image",
			title: `${document.officialNumber} - ${documentTitle}`,
			description: description.substring(0, 160),
		},
	};
}

export default async function DocumentDetailPage({ params }: PageProps) {
	const { id } = await params;

	// Validate numeric id
	const idNum = Number(id);
	if (!Number.isFinite(idNum) || idNum <= 0) {
		notFound();
	}

	const [error, documentData] = await api.legislativeDocuments.getById({
		id: idNum,
	});

	if (error || !documentData) {
		if (error && isDefinedError(error)) {
			console.error("Failed to fetch document:", error.message);
		}
		notFound();
	}

	// Transform date strings to Date objects
	const document = transformDocumentDates(documentData);

	return (
		<div className="min-h-screen bg-gray-50">
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

			<div className="container mx-auto px-4 py-8">
				<Card className="p-4 sm:p-6 md:p-8">
					<div className="space-y-6">
						<DocumentHeader document={document} />
						<PDFViewer document={document} />
					</div>
				</Card>
			</div>
		</div>
	);
}
