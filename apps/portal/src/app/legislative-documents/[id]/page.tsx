import { isDefinedError } from "@orpc/client";
import { getClassificationLabel, transformDocumentDates } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { OfflineAwareSuspense } from "@repo/ui/components/offline-aware-suspense";
import { OnlineStatusBanner } from "@repo/ui/components/online-status-banner";
import { ScrollToTop as ScrollToTopButton } from "@repo/ui/components/scroll-to-top";
import { ChevronLeft } from "@repo/ui/lib/lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	DocumentHeader,
	DocumentSidebar,
	DocumentViewer,
} from "@/components/legislative-documents/";
import { ScrollToTop } from "@/components/scroll-to-top";
import { api } from "@/lib/api.client";
import { createPageMetadata, truncateDescription } from "@/lib/seo-metadata";
import DocumentDetailLoading from "./loading";

export const revalidate = 300;

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
	const shortDescription = truncateDescription(description);
	const fullTitle = `${document.officialNumber} - ${documentTitle}`;

	const metadata = createPageMetadata({
		title: fullTitle,
		description: shortDescription,
		url: `/legislative-documents/${id}`,
		imagePath: `/legislative-documents/${id}/opengraph-image`,
		ogType: "article",
		ogExtra: {
			description,
			publishedTime: document.dateEnacted.toISOString(),
		},
	});

	return metadata;
}

export default async function DocumentDetailPage({ params }: PageProps) {
	const { id } = await params;

	return (
		<div className="min-h-screen bg-gray-50 pb-12">
			<ScrollToTop />
			<OnlineStatusBanner />
			<ScrollToTopButton />
			<OfflineAwareSuspense fallback={<DocumentDetailLoading />}>
				<DocumentDetailContent id={id} />
			</OfflineAwareSuspense>
		</div>
	);
}

async function DocumentDetailContent({ id }: { id: string }) {
	// Validate numeric id
	const idNum = Number(id);
	if (!Number.isFinite(idNum) || idNum <= 0) {
		notFound();
	}

	const [error, documentData] = await api.legislativeDocuments.getById({
		id: idNum,
	});

	if (error) {
		if (isDefinedError(error) && error.code === "NOT_FOUND") {
			notFound();
		}

		throw new Error(
			isDefinedError(error)
				? error.message
				: "Unable to load legislative document details.",
		);
	}

	if (!documentData) {
		notFound();
	}

	// Transform date strings to Date objects
	const document = transformDocumentDates(documentData);

	return (
		<>
			<div className="sticky top-18 sm:top-22 z-30 bg-white border-b border-gray-200 shadow-sm">
				<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-4">
					<Link href="/legislative-documents">
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2 cursor-pointer"
						>
							<ChevronLeft className="h-4 w-4" />
							Back to Documents
						</Button>
					</Link>
				</div>
			</div>

			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				<div className="space-y-6">
					<article className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
						<DocumentHeader document={document} />
					</article>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="order-2 lg:order-1 lg:col-span-2">
							<DocumentViewer document={document} pdfUrl={document.pdfUrl} />
						</div>
						<div className="order-1 lg:order-2 lg:col-span-1">
							<DocumentSidebar document={document} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
