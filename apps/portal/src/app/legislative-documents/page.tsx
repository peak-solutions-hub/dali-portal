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

	// Handle errors
	if (error) {
		if (isDefinedError(error)) {
			console.error(error);
		}
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
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-6 py-8 max-w-7xl">
				{/* Page Header */}
				<div className="mb-6">
					<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-['Playfair_Display']">
						Legislative Documents
					</h1>
					<p className="text-gray-600 text-sm">
						Browse the official list of Iloilo City legislative documents
					</p>
				</div>

				<SearchFilterBar availableYears={availableYears} />

				{documents.length > 0 && (
					<PaginationControls
						pagination={pagination}
						currentFilters={currentFilters}
					/>
				)}

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
