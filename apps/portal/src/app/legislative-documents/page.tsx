import { Card } from "@repo/ui/components/card";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
	DocumentCard,
	PaginationControls,
	SearchFilterBar,
} from "@/components/legislative-documents/";
import {
	fetchAvailableYears,
	fetchLegislativeDocuments,
} from "@/lib/legislative-documents/data";
import {
	buildQueryString,
	toDocumentFilters,
	validateSearchParams,
} from "@/lib/legislative-documents/utils";

interface PageProps {
	searchParams: Promise<{
		search?: string;
		type?: string;
		year?: string;
		classification?: string;
		page?: string;
	}>;
}

export const metadata = {
	title: "Legislative Documents — Iloilo City",
	description:
		"Browse Iloilo City's official legislative documents: ordinances, resolutions, and committee reports.",
};

export default async function LegislativeDocumentsPage({
	searchParams,
}: PageProps) {
	const params = await searchParams;

	// Validate search parameters with Zod
	const validationResult = validateSearchParams(params);

	// If validation fails, redirect to valid default params
	if (!validationResult.success) {
		const queryString = buildQueryString({
			search: "",
			type: "all",
			year: "all",
			classification: "all",
			page: "1",
		});
		redirect(`/legislative-documents?${queryString}`);
	}

	const validatedParams = validationResult.data;

	// Convert to DocumentFilters format
	const filters = toDocumentFilters(validatedParams);

	// Fetch data server-side
	const [{ documents, pagination }, availableYears] = await Promise.all([
		fetchLegislativeDocuments(filters),
		fetchAvailableYears(),
	]);

	// Build current filters for pagination using validated values
	const currentFilters = {
		search: validatedParams.search,
		type: validatedParams.type,
		year:
			typeof validatedParams.year === "number"
				? String(validatedParams.year)
				: "all",
		classification: validatedParams.classification,
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8 mt-19 max-w-7xl">
				{/* Page Header */}
				<div className="mb-6">
					<h1
						className="text-3xl text-gray-800 mb-1"
						style={{ fontFamily: "Playfair Display" }}
					>
						LEGISLATIVE DOCUMENTS
					</h1>
					<p className="text-gray-600 text-sm">
						Browse the official list of Iloilo City legislative documents
					</p>
				</div>

				{/* Search and Filters - Client Component */}
				<Suspense fallback={<div className="h-32 bg-white animate-pulse" />}>
					<SearchFilterBar availableYears={availableYears} />
				</Suspense>

				{/* Pagination Controls - Top */}
				{documents.length > 0 && (
					<Suspense fallback={<div className="h-16 bg-white animate-pulse" />}>
						<PaginationControls
							pagination={pagination}
							currentFilters={currentFilters}
						/>
					</Suspense>
				)}

				{/* Documents List */}
				{documents.length > 0 ? (
					<div className="space-y-3">
						{documents.map((document) => (
							<DocumentCard key={document.id} document={document} />
						))}
					</div>
				) : (
					<Card className="p-12">
						<div className="text-center text-gray-500">
							<p className="text-lg mb-2">No Documents Found</p>
							<p className="text-sm">
								Try adjusting your filters or search terms
							</p>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
