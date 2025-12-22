/**
 * Utility functions for Legislative Documents
 */

import type {
	DocumentFilters,
	LegislativeDocumentWithDetails,
} from "types/legislative-documents.types";
import {
	CLASSIFICATIONS,
	DOCUMENT_TYPE_LABELS,
	DOCUMENT_TYPES,
} from "./constants";

/**
 * Format a date string to Philippine locale format (e.g., "January 15, 2024")
 */
export function formatDate(dateStr: string): string {
	if (!dateStr) return "N/A";
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return "N/A";

	try {
		return date.toLocaleDateString("en-PH", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	} catch (error) {
		console.error("Error formatting date:", error);
		return dateStr;
	}
}

/**
 * Get the display label for a document type
 */
export function getDocumentType(doc: LegislativeDocumentWithDetails): string {
	return DOCUMENT_TYPE_LABELS[doc.type] || doc.type;
}

/**
 * Get the document number (official_number or code_number)
 */
export function getDocumentNumber(doc: LegislativeDocumentWithDetails): string {
	return doc.official_number || doc.document?.code_number || "N/A";
}

/**
 * Get the display title for a document
 */
export function getDocumentTitle(doc: LegislativeDocumentWithDetails): string {
	return doc.displayTitle || doc.document?.title || "Untitled Document";
}

/**
 * Get available years from documents
 */
export function getAvailableYears(
	documents: LegislativeDocumentWithDetails[],
): number[] {
	const years = documents
		.map((doc) => doc.series_year)
		.filter((year): year is number => typeof year === "number");

	return Array.from(new Set(years)).sort((a, b) => b - a);
}

/**
 * Build a query string from filters
 */
export function buildQueryString(
	filters: Record<string, string | number | undefined>,
): string {
	const params = new URLSearchParams();

	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== "all") {
			params.set(key, String(value));
		}
	});

	return params.toString();
}

/**
 * Get badge color class for document type
 */
export function getDocumentTypeBadgeClass(type: string): string {
	const typeColorMap: Record<string, string> = {
		proposed_ordinance: "bg-blue-100 text-blue-800",
		proposed_resolution: "bg-green-100 text-green-800",
		committee_report: "bg-purple-100 text-purple-800",
	};

	return typeColorMap[type] || "bg-gray-100 text-gray-800";
}

/**
 * Get classification badge color (using primary color)
 */
export function getClassificationBadgeClass(): string {
	return "bg-[#a60202]/10 text-[#a60202] border border-[#a60202]/20";
}

/**
 * Validate and normalize query parameters from URL search params
 */
export function validateQueryParams(params: {
	search?: string;
	type?: string;
	year?: string;
	classification?: string;
	page?: string;
}): DocumentFilters {
	// Extract valid type values from DOCUMENT_TYPES constant and type them
	const validTypes = DOCUMENT_TYPES.map((t) => t.value) as ReadonlyArray<
		DocumentFilters["type"]
	>;

	// Validate and normalize type parameter
	const validatedType: DocumentFilters["type"] =
		params.type && validTypes.includes(params.type as DocumentFilters["type"])
			? (params.type as DocumentFilters["type"])
			: undefined;

	// Validate and normalize classification parameter (typed from constants)
	const validClassifications = CLASSIFICATIONS as ReadonlyArray<
		DocumentFilters["classification"]
	>;

	const validatedClassification: DocumentFilters["classification"] =
		params.classification &&
		validClassifications.includes(
			params.classification as DocumentFilters["classification"],
		)
			? (params.classification as DocumentFilters["classification"])
			: undefined;

	// Normalize numeric query params
	const yearParam = params.year ? Number(params.year) : undefined;
	const validYear: DocumentFilters["year"] =
		typeof yearParam === "number" && !Number.isNaN(yearParam) && yearParam > 0
			? yearParam
			: "all";

	const pageParam = params.page ? Number(params.page) : undefined;
	const validPage =
		typeof pageParam === "number" && Number.isFinite(pageParam) && pageParam > 0
			? Math.floor(pageParam)
			: 1;

	return {
		searchTerm: params.search,
		type: validatedType,
		year: validYear,
		classification: validatedClassification,
		page: validPage,
	};
}

/**
 * Placeholder function for search implementation
 * TODO: Implement full-text search logic
 */
// export async function searchDocuments(
//   query: string
// ): Promise<LegislativeDocumentWithDetails[]> {
//   console.log("Search not yet implemented:", query);
//   // TODO: Implement search logic with Supabase
//   return [];
// }

// /**
//  * Placeholder function for PDF download
//  * TODO: Implement download from Supabase Storage
//  */
// export async function downloadDocument(documentId: string): Promise<void> {
//   console.log("Download not yet implemented:", documentId);
//   // TODO: Implement download logic with Supabase Storage
// }
