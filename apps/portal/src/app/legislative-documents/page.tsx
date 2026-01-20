import { isDefinedError } from "@orpc/client";
import {
	buildQueryString,
	toApiFilters,
	transformDocumentListDates,
	validateSearchParams,
} from "@repo/shared";
import { Card } from "@repo/ui/components/card";
import { redirect } from "next/navigation";
import {
	DocumentCard,
	PaginationControls,
	SearchFilterBar,
} from "@/components/legislative-documents/";
import { api } from "@/lib/api.client";

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

	// Convert to API input format
	const filters = toApiFilters(validatedParams);

	// Fetch data server-side
	const [error, documentsData] = await api.legislativeDocuments.list(filters);

	// Handle API errors with user-visible message
	if (error) {
		console.error("API error fetching documents:", error);

		let errorMessage = "An unexpected error occurred";
		if (isDefinedError(error)) {
			errorMessage = (error as { message?: string }).message || errorMessage;
		}

		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-6 py-8 max-w-7xl">
					<div className="mb-6">
						<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-['Playfair_Display']">
							Legislative Documents
						</h1>
						<p className="text-gray-600 text-sm">
							Browse the official list of Iloilo City legislative documents
						</p>
					</div>
					<Card className="p-12 border-red-200 bg-red-50">
						<div className="text-center">
							<p className="text-lg mb-2 text-red-800 font-semibold">
								Unable to Load Documents
							</p>
							<p className="text-sm text-red-700 mb-4">
								We're experiencing technical difficulties loading the
								legislative documents. Please try refreshing the page.
							</p>
							<p className="text-xs text-red-600">Error: {errorMessage}</p>
						</div>
					</Card>
				</div>
			</div>
		);
	}

	// Extract data and transform date strings to Date objects
	const documents = documentsData?.documents
		? transformDocumentListDates(documentsData.documents)
		: [];
	const pagination = documentsData?.pagination || {
		currentPage: 1,
		totalPages: 0,
		totalItems: 0,
		itemsPerPage: filters.limit || 10,
		hasNextPage: false,
		hasPreviousPage: false,
	};

	// Generate available years from 1950 to present
	const currentYear = new Date().getFullYear();
	const availableYears = Array.from(
		{ length: currentYear - 1950 + 1 },
		(_, i) => currentYear - i,
	);

	// Build current filters for pagination using validated values
	const currentFilters = {
		search: validatedParams.search,
		type: validatedParams.type === "all" ? "all" : validatedParams.type,
		year:
			typeof validatedParams.year === "number"
				? String(validatedParams.year)
				: "all",
		classification:
			validatedParams.classification === "all"
				? "all"
				: validatedParams.classification,
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-3 sm:py-4 flex-grow">
				{/* Page Header */}
				<div className="mb-6">
					<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-['Playfair_Display']">
						Legislative Documents
					</h1>
					<p className="text-gray-600 text-sm">
						Browse the official list of Iloilo City legislative documents
					</p>
				</div>

				{/* Desktop & Mobile Sticky Header: Search Bar & Top Pagination */}
				<div className="sticky top-16 sm:top-20 z-30 bg-gray-50 pt-4 pb-4">
					<div className="flex flex-col gap-4">
						<SearchFilterBar availableYears={availableYears} />

						{/* Desktop Only Pagination (Top) */}
						{documents.length > 0 && (
							<div className="hidden lg:block">
								<PaginationControls
									pagination={pagination}
									currentFilters={currentFilters}
								/>
							</div>
						)}
					</div>
				</div>

				{/* Content Area */}
				<div className="flex flex-col gap-4 pb-24 lg:pb-0">
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

					{/* Mobile Sticky Pagination - Bottom */}
					{documents.length > 0 && (
						<div className="lg:hidden sticky bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 p-4 shadow-lg">
							<PaginationControls
								pagination={pagination}
								currentFilters={currentFilters}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
