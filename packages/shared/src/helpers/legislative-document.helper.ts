/**
 * Shared utility functions for Legislative Documents
 * These can be used across portal and admin frontends
 */

import { z } from "zod";
import { ClassificationType } from "../enums/document";
import { LegislativeDocumentType } from "../enums/legislative-document";
import {
	ClassificationTypeEnum,
	LegislativeDocumentTypeEnum,
} from "../schemas/document.schema";
import type {
	GetLegislativeDocumentListInput,
	LegislativeDocumentWithDetails,
} from "../schemas/legislative-document.schema";

/**
 * Display labels for legislative document types
 */
export const LEGISLATIVE_DOCUMENT_TYPE_LABELS: Record<string, string> = {
	[LegislativeDocumentType.ORDINANCE]: "Ordinance",
	[LegislativeDocumentType.RESOLUTION]: "Resolution",
};

/**
 * Document types for filtering (used in UI)
 */
export const LEGISLATIVE_DOCUMENT_TYPES = [
	{ value: LegislativeDocumentType.ORDINANCE, label: "Ordinance" },
	{ value: LegislativeDocumentType.RESOLUTION, label: "Resolution" },
] as const;

/**
 * Helper function to convert snake_case to Title Case
 */
function toTitleCase(snakeCase: string): string {
	return snakeCase
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ")
		.replace(/And/g, "&")
		.replace(/Of/g, "of");
}

/**
 * Classification type display labels (auto-generated from enum)
 */
export const CLASSIFICATION_TYPE_LABELS: Record<string, string> = Object.values(
	ClassificationType,
).reduce(
	(acc, value) => {
		acc[value] = toTitleCase(value);
		return acc;
	},
	{} as Record<string, string>,
);

/**
 * Classification types for filtering (used in UI)
 */
export const CLASSIFICATION_TYPES = Object.entries(
	CLASSIFICATION_TYPE_LABELS,
).map(([value, label]) => ({ value, label }));

/**
 * Default items per page for pagination
 */
export const ITEMS_PER_PAGE = 10;

/**
 * Format a date to Philippine locale format (e.g., "January 15, 2024")
 */
export function formatDate(date: Date | string): string {
	if (!date) return "N/A";

	const dateObj = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(dateObj.getTime())) return "N/A";

	try {
		return dateObj.toLocaleDateString("en-PH", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	} catch {
		return String(date);
	}
}

/**
 * Get the display label for a document type
 */
export function getDocumentTypeLabel(type: string): string {
	return LEGISLATIVE_DOCUMENT_TYPE_LABELS[type] || type;
}

/**
 * Get the display label for a classification type
 */
export function getClassificationLabel(classification: string): string {
	return CLASSIFICATION_TYPE_LABELS[classification] || classification;
}

/**
 * Get the document number (officialNumber or codeNumber)
 */
export function getDocumentNumber(doc: LegislativeDocumentWithDetails): string {
	return doc.officialNumber || doc.document?.codeNumber || "N/A";
}

/**
 * Get the display title for a document
 */
export function getDocumentTitle(doc: LegislativeDocumentWithDetails): string {
	return doc.displayTitle || doc.document?.title || "Untitled Document";
}

/**
 * Build a query string from filters
 */
export function buildQueryString(
	filters: Record<string, string | number | undefined>,
): string {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== "" && value !== "all") {
			params.set(key, String(value));
		}
	}

	return params.toString();
}

/**
 * Get badge color class for document type
 */
export function getDocumentTypeBadgeClass(type: string): string {
	const typeColorMap: Record<string, string> = {
		ordinance: "bg-blue-100 text-blue-800",
		resolution: "bg-green-100 text-green-800",
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
		return false;
	}
}

/**
 * Generate a safe filename for document downloads
 */
export function getDocumentFilename(
	doc: LegislativeDocumentWithDetails,
): string {
	if (doc.pdfFilename) {
		return doc.pdfFilename;
	}

	const documentNumber = getDocumentNumber(doc);
	const sanitized = documentNumber.replace(/[^a-zA-Z0-9-_]/g, "_");

	return `${sanitized}.pdf`;
}

/**
 * Zod schema for validating URL search parameters
 * Aligns with backend GetLegislativeDocumentListSchema but handles "all" values
 */
export const searchParamsSchema = z.object({
	search: z.string().optional().default(""),
	type: z
		.union([LegislativeDocumentTypeEnum, z.literal("all"), z.literal("")])
		.optional()
		.default("all")
		.transform((val) => (val === "" ? "all" : val)),
	year: z
		.union([z.coerce.number().int().min(2000), z.literal("all"), z.literal("")])
		.optional()
		.default("all")
		.transform((val) => (val === "" ? "all" : val)),
	classification: z
		.union([ClassificationTypeEnum, z.literal("all"), z.literal("")])
		.optional()
		.default("all")
		.transform((val) => (val === "" ? "all" : val)),
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.optional()
		.default(ITEMS_PER_PAGE),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

/**
 * Validate search parameters using Zod schema
 */
export function validateSearchParams(
	params: Record<string, string | undefined>,
) {
	return searchParamsSchema.safeParse(params);
}

/**
 * Convert validated search params to API input format
 */
export function toApiFilters(
	params: SearchParams,
): GetLegislativeDocumentListInput {
	return {
		search: params.search || undefined,
		type: params.type === "all" ? undefined : params.type,
		year: params.year === "all" ? undefined : params.year,
		classification:
			params.classification === "all" ? undefined : params.classification,
		page: params.page,
		limit: params.limit,
	};
}

/**
 * Get available years from documents
 */
export function getAvailableYearsFromDocs(
	documents: LegislativeDocumentWithDetails[],
): number[] {
	const years = documents
		.map((doc) => doc.seriesYear)
		.filter((year): year is number => typeof year === "number");

	return Array.from(new Set(years)).sort((a, b) => b - a);
}

/**
 * Type for API response where dates are ISO strings (before transformation)
 */
export type LegislativeDocumentAPIResponse = Omit<
	LegislativeDocumentWithDetails,
	"dateEnacted" | "createdAt" | "document" | "latestVersion"
> & {
	dateEnacted: string;
	createdAt: string;
	document: Omit<LegislativeDocumentWithDetails["document"], "receivedAt"> & {
		receivedAt: string;
	};
	latestVersion?: Omit<
		NonNullable<LegislativeDocumentWithDetails["latestVersion"]>,
		"createdAt"
	> & {
		createdAt: string;
	};
};

/**
 * Convert ISO date strings from API response to Date objects
 * oRPC/HTTP serializes Date objects as ISO strings, so we need to convert them back
 */
export function transformDocumentDates(
	doc: LegislativeDocumentAPIResponse,
): LegislativeDocumentWithDetails {
	return {
		...doc,
		dateEnacted: new Date(doc.dateEnacted),
		createdAt: new Date(doc.createdAt),
		document: {
			...doc.document,
			receivedAt: new Date(doc.document.receivedAt),
		},
		latestVersion: doc.latestVersion
			? {
					...doc.latestVersion,
					createdAt: new Date(doc.latestVersion.createdAt),
				}
			: undefined,
	};
}

/**
 * Transform multiple documents' date strings to Date objects
 */
export function transformDocumentListDates(
	documents: LegislativeDocumentAPIResponse[],
): LegislativeDocumentWithDetails[] {
	return documents.map(transformDocumentDates);
}
