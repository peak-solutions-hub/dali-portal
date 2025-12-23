/**
 * Utility functions for Legislative Documents
 */

import { DocumentType } from "@repo/shared";
import type {
	DocumentFilters,
	LegislativeDocumentWithDetails,
} from "types/legislative-documents.types";
import { z } from "zod";

/**
 * Display labels for legislative document types
 */
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
	[DocumentType.PROPOSED_ORDINANCE]: "Proposed Ordinance",
	[DocumentType.PROPOSED_RESOLUTION]: "Proposed Resolution",
	[DocumentType.COMMITTEE_REPORT]: "Committee Report",
};

/**
 * Document types for filtering (used in UI)
 */
export const DOCUMENT_TYPES = [
	{ value: DocumentType.PROPOSED_ORDINANCE, label: "Proposed Ordinance" },
	{ value: DocumentType.PROPOSED_RESOLUTION, label: "Proposed Resolution" },
	{ value: DocumentType.COMMITTEE_REPORT, label: "Committee Report" },
] as const;

/**
 * Items per page for pagination
 */
export const ITEMS_PER_PAGE = 10;

/**
 * Classifications for legislative documents (display labels)
 * These map to user-friendly labels shown in the UI
 */
export const CLASSIFICATIONS = [
	"Appropriation",
	"Barangay Affairs",
	"Charter Amendment",
	"Civil Service",
	"Commendation",
	"Committee Investigation",
	"Committee Report",
	"Cultural Development",
	"Declaration",
	"Economic Development",
	"Education",
	"Environment",
	"Good Governance",
	"Health & Sanitation",
	"Infrastructure",
	"Labor & Employment",
	"Laws & Ordinances",
	"Public Safety",
	"Public Works",
	"Social Services",
	"Tourism",
	"Transportation",
	"Urban Planning",
	"Ways and Means",
	"Women & Children",
	"Youth Development",
] as const;

/**
 * Zod schema for validating search parameters from URL
 */
const DocumentTypeSchema = z.enum([
	DocumentType.PROPOSED_ORDINANCE,
	DocumentType.PROPOSED_RESOLUTION,
	DocumentType.COMMITTEE_REPORT,
]);

const ClassificationSchema = z.enum([
	"Appropriation",
	"Barangay Affairs",
	"Charter Amendment",
	"Civil Service",
	"Commendation",
	"Committee Investigation",
	"Committee Report",
	"Cultural Development",
	"Declaration",
	"Economic Development",
	"Education",
	"Environment",
	"Good Governance",
	"Health & Sanitation",
	"Infrastructure",
	"Labor & Employment",
	"Laws & Ordinances",
	"Public Safety",
	"Public Works",
	"Social Services",
	"Tourism",
	"Transportation",
	"Urban Planning",
	"Ways and Means",
	"Women & Children",
	"Youth Development",
]);

export const searchParamsSchema = z.object({
	search: z.string().optional().default(""),
	type: z
		.union([DocumentTypeSchema, z.literal("all")])
		.optional()
		.default("all"),
	year: z
		.union([
			z.coerce.number().int().positive(),
			z.literal("all"),
			z.literal(""),
		])
		.optional()
		.default("all")
		.transform((val: number | "all" | "") => (val === "" ? "all" : val)),
	classification: z
		.union([ClassificationSchema, z.literal("all")])
		.optional()
		.default("all"),
	page: z.coerce.number().int().positive().optional().default(1),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

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
 * Validate and sanitize URL to prevent XSS attacks
 * Only allows HTTP(S) URLs and relative paths
 */
export function isValidPdfUrl(url: string): boolean {
	if (!url) return false;

	try {
		// Allow relative URLs
		if (url.startsWith("/")) {
			return true;
		}

		// Parse and validate absolute URLs
		const parsedUrl = new URL(url);
		const validProtocols = ["http:", "https:"];

		return validProtocols.includes(parsedUrl.protocol);
	} catch {
		// If URL parsing fails, it's invalid
		return false;
	}
}

/**
 * Generate a safe filename for document downloads
 */
export function getDocumentFilename(
	doc: LegislativeDocumentWithDetails,
): string {
	// Use pdfFilename if available
	if (doc.pdfFilename) {
		return doc.pdfFilename;
	}

	// Generate from document number
	const documentNumber = getDocumentNumber(doc);
	const sanitized = documentNumber.replace(/[^a-zA-Z0-9-_]/g, "_");

	return `${sanitized}.pdf`;
}

/**
 * Validate search parameters using Zod schema
 * Returns either validated params or null if validation fails
 */
export function validateSearchParams(
	params: Record<string, string | undefined>,
) {
	return searchParamsSchema.safeParse(params);
}

/**
 * Convert validated search params to DocumentFilters format
 */
export function toDocumentFilters(
	params: z.infer<typeof searchParamsSchema>,
): DocumentFilters {
	return {
		searchTerm: params.search || undefined,
		type: params.type === "all" ? undefined : params.type,
		year: params.year === "all" ? "all" : params.year,
		classification:
			params.classification === "all" ? undefined : params.classification,
		page: params.page,
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
