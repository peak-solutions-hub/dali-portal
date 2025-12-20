import { Card } from "@repo/ui/components/card";
import { Suspense } from "react";
import type { DocumentFilters } from "types/legislative-documents.types";
import { DocumentCard } from "@/components/legislative-documents/document-card";
import { PaginationControls } from "@/components/legislative-documents/pagination-controls";
import { SearchFilterBar } from "@/components/legislative-documents/search-filter-bar";
import {
	fetchAvailableYears,
	fetchLegislativeDocuments,
} from "@/lib/legislative-documents/data";

interface PageProps {
	searchParams: Promise<{
		search?: string;
		type?: string;
		year?: string;
		classification?: string;
		page?: string;
	}>;
}

export default async function LegislativeDocumentsPage({
	searchParams,
}: PageProps) {
	const params = await searchParams;

	// Build filters from URL search params
	const filters: DocumentFilters = {
		searchTerm: params.search,
		type: params.type ? (params.type as DocumentFilters["type"]) : undefined,
		year: params.year ? Number(params.year) : "all",
		classification: params.classification,
		page: params.page ? Number(params.page) : 1,
	};

	// Fetch data server-side
	const [{ documents, pagination }, availableYears] = await Promise.all([
		fetchLegislativeDocuments(filters),
		fetchAvailableYears(),
	]);

	// Build current filters for pagination
	const currentFilters = {
		search: params.search || "",
		type: params.type || "all",
		year: params.year || "all",
		classification: params.classification || "all",
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
