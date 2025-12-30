/**
 * Shared utility functions for Legislative Documents
 * These can be used across portal and admin frontends
 */

import { z } from "zod";
import { ClassificationType, DocumentType } from "../enums/document";
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
	[DocumentType.PROPOSED_ORDINANCE]: "Proposed Ordinance",
	[DocumentType.PROPOSED_RESOLUTION]: "Proposed Resolution",
	[DocumentType.COMMITTEE_REPORT]: "Committee Report",
};

/**
 * Document types for filtering (used in UI)
 */
export const LEGISLATIVE_DOCUMENT_TYPES = [
	{ value: DocumentType.PROPOSED_ORDINANCE, label: "Proposed Ordinance" },
	{ value: DocumentType.PROPOSED_RESOLUTION, label: "Proposed Resolution" },
	{ value: DocumentType.COMMITTEE_REPORT, label: "Committee Report" },
] as const;

/**
 * Classification type display labels (snake_case to Title Case)
 */
export const CLASSIFICATION_TYPE_LABELS: Record<string, string> = {
	[ClassificationType.APPROPRIATIONS]: "Appropriations",
	[ClassificationType.BARANGAY_AFFAIRS_AND_COMMUNITY_DEVELOPMENT]:
		"Barangay Affairs & Community Development",
	[ClassificationType.COMMUNICATION_AND_PUBLIC_INFORMATION]:
		"Communication & Public Information",
	[ClassificationType.COOPERATIVE_AND_LIVELIHOOD]: "Cooperative & Livelihood",
	[ClassificationType.DISASTER_RELIEF]: "Disaster Relief",
	[ClassificationType.DOMESTIC_AND_INTERNATIONAL_RELATIONS]:
		"Domestic & International Relations",
	[ClassificationType.EDUCATION_SCIENCE_AND_TECHNOLOGY]:
		"Education, Science & Technology",
	[ClassificationType.ELECTRIC_GAS_AND_UTILITIES]: "Electric, Gas & Utilities",
	[ClassificationType.ENGINEERING_CONSTRUCTION_AND_PUBLIC_WORKS]:
		"Engineering, Construction & Public Works",
	[ClassificationType.ETHICS_AND_RULES_OF_PROFESSIONAL_SPORTS]:
		"Ethics & Rules of Professional Sports",
	[ClassificationType.FIRE_SANITATION_AND_HOSPITAL_SERVICES]:
		"Fire, Sanitation & Hospital Services",
	[ClassificationType.INFORMATION_TECHNOLOGY_AND_COMPUTERIZATION]:
		"Information Technology & Computerization",
	[ClassificationType.LABOR_EMPLOYMENT_MANPOWER_DEVELOPMENT_AND_PERSONNEL]:
		"Labor, Employment & Manpower Development",
	[ClassificationType.MARKET_AND_SLAUGHTERHOUSE]: "Market & Slaughterhouse",
	[ClassificationType.PEACE_AND_ORDER]: "Peace & Order",
	[ClassificationType.PUBLIC_SAFETY_GOOD_GOVERNMENT_AND_PUBLIC_ACCOUNTABILITY]:
		"Public Safety & Good Government",
	[ClassificationType.PUBLIC_FIRE_PENOLOGY_PUBLIC_SAFETY_ORDER_AND_SECURITY]:
		"Public Fire, Penology & Security",
	[ClassificationType.PUBLIC_SERVICES_ENVIRONMENTAL_PROTECTION_AND_ECOLOGY]:
		"Public Services & Environmental Protection",
	[ClassificationType.PUBLIC_UTILITIES_ENERGY_STYLE_JUSTICE_AND_LEGAL_MATTERS]:
		"Public Utilities & Legal Matters",
	[ClassificationType.REAL_ESTATE]: "Real Estate",
	[ClassificationType.SOCIAL_WELFARE_AND_HISTORICAL_AFFAIRS]:
		"Social Welfare & Historical Affairs",
	[ClassificationType.TOURISM_CULTURE_AND_INDUSTRY]:
		"Tourism, Culture & Industry",
	[ClassificationType.TRADE_COMMERCE_AND_INDUSTRY]:
		"Trade, Commerce & Industry",
	[ClassificationType.TRANSPORTATION_HOUSING_AND_LAND_DEVELOPMENT_ZONING]:
		"Transportation, Housing & Land Development",
	[ClassificationType.URBAN_POOR_HUMAN_RIGHTS_AND_MINORITY_GROUPS]:
		"Urban Poor & Human Rights",
	[ClassificationType.VETERANS_RETIREES_ELDERLY_AND_DISABLED_PERSON]:
		"Veterans, Retirees & Elderly",
	[ClassificationType.WOMEN_AND_FAMILY_RELATIONS]: "Women & Family Relations",
	[ClassificationType.YOUTH_AND_SPORTS_DEVELOPMENT]:
		"Youth & Sports Development",
};

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
	"dateEnacted" | "createdAt" | "document"
> & {
	dateEnacted: string;
	createdAt: string;
	document: Omit<LegislativeDocumentWithDetails["document"], "receivedAt"> & {
		receivedAt: string;
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
