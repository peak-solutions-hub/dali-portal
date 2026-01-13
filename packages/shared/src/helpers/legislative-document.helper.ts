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
 * Classification type display labels (manually curated for proper formatting)
 */
export const CLASSIFICATION_TYPE_LABELS: Record<string, string> = {
	[ClassificationType.AGRICULTURE_FISHERIES_AQUATIC_AND_NATURAL_RESOURCES]:
		"Agriculture, Fisheries, Aquatic and Natural Resources",
	[ClassificationType.ANIMAL_WELFARE]: "Animal Welfare",
	[ClassificationType.APPROPRIATIONS]: "Appropriations",
	[ClassificationType.BARANGAY_AFFAIRS_AND_COMMUNITY_DEVELOPMENT]:
		"Barangay Affairs and Community Development",
	[ClassificationType.COMMUNICATION_AND_PUBLIC_INFORMATION]:
		"Communication and Public Information",
	[ClassificationType.COOPERATIVES_AND_LIVELIHOOD]:
		"Cooperatives and Livelihood",
	[ClassificationType.DISASTER_RELIEF_OR_DISASTER_MANAGEMENT]:
		"Disaster Relief/ Disaster Management",
	[ClassificationType.DOMESTIC_AND_INTERNATIONAL_RELATIONS]:
		"Domestic and International Relations",
	[ClassificationType.EDUCATION_SCIENCE_AND_TECHNOLOGY]:
		"Education, Science and Technology",
	[ClassificationType.ENERGY_AND_PUBLIC_UTILITIES]:
		"Energy and Public Utilities",
	[ClassificationType.ENGINEERING_CONSTRUCTION_AND_PUBLIC_WORKS]:
		"Engineering, Construction and Public Works",
	[ClassificationType.GAMES_AMUSEMENT_AND_PROFESSIONAL_SPORTS]:
		"Games, Amusement and Professional Sports",
	[ClassificationType.GOOD_GOVERNMENT_AND_PUBLIC_ACCOUNTABILITY_BLUE_RIBBON_COMMITTEE]:
		"Good Government and Public Accountability (Blue Ribbon Committee)",
	[ClassificationType.HEALTH_SANITATION_AND_HOSPITAL_SERVICES]:
		"Health, Sanitation, and Hospital Services",
	[ClassificationType.INFORMATION_TECHNOLOGY_AND_COMPUTERIZATION]:
		"Information Technology and Computerization",
	[ClassificationType.LABOR_EMPLOYMENT_MANPOWER_DEVELOPMENT_AND_PLACEMENT]:
		"Labor, Employment, Manpower Development and Placement",
	[ClassificationType.LOCAL_ACCREDITATION]: "Local Accreditation",
	[ClassificationType.MARKETS_AND_SLAUGHTERHOUSE]: "Markets & Slaughterhouse",
	[ClassificationType.MORAL_RECOVERY]: "Moral Recovery",
	[ClassificationType.POLICE_FIRE_PENOLOGY_PS_OS_DDR]:
		"Police, Fire, Penology, Public Safety, Order & Security, Dangerous Drugs and Rehabilitation",
	[ClassificationType.PUBLIC_SERVICES_ENVIRONMENTAL_PROTECTION_AND_ECOLOGY]:
		"Public Services, Environmental Protection and Ecology",
	[ClassificationType.RULES_ORDINANCES_RESOLUTIONS_STYLE_JUSTICE_AND_LEGAL_AFFAIRS]:
		"Rules, Ordinances, Resolutions, and Style; Justice and Legal Affairs",
	[ClassificationType.SOCIAL_SERVICES]: "Social Services",
	[ClassificationType.TOURISM_CULTURE_AND_HISTORICAL_AFFAIRS]:
		"Tourism, Culture and Historical Affairs",
	[ClassificationType.TRADE_COMMERCE_AND_INDUSTRY]:
		"Trade, Commerce & Industry",
	[ClassificationType.TRANSPORTATION]: "Transportation",
	[ClassificationType.URBAN_PLANNING_HOUSING_LD_ZONING_EXPROPRIATION_AALA]:
		"Urban, Planning, Housing, Land Development, Zoning, Expropriation, Assessment and Land Acquisition",
	[ClassificationType.URBAN_POOR_HUMAN_RIGHTS_AND_MINORITY_GROUPS]:
		"Urban Poor, Human Rights and Minority Groups",
	[ClassificationType.VETERANS_RETIREES_ELDERLY_AND_DISABLED_PERSON]:
		"Veterans, Retirees, Elderly and Disabled Person",
	[ClassificationType.WAYS_AND_MEANS]: "Ways and Means",
	[ClassificationType.WOMEN_AND_FAMILY_RELATIONS]: "Women and Family Relations",
	[ClassificationType.YOUTH_AND_SPORTS_DEVELOPMENT]:
		"Youth and Sports Development",
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
		return "N/A";
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
	const sanitized = documentNumber
		.replace(/[^a-zA-Z0-9-_]+/g, "_")
		.replace(/^_+|_+$/g, "");

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
		.union([z.coerce.number().int().min(1950), z.literal("all"), z.literal("")])
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
