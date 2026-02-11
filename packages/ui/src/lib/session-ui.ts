/**
 * UI-specific constants and helpers for Legislative Sessions (Shared UI package)
 * These are presentation-layer utilities used for display and styling
 */

/**
 * Session type display labels
 */
export const SESSION_TYPE_LABELS: Record<string, string> = {
	regular: "Regular Session",
	special: "Special Session",
};

/**
 * Session status display labels
 */
export const SESSION_STATUS_LABELS: Record<string, string> = {
	scheduled: "Scheduled",
	completed: "Completed",
	draft: "Draft",
};

/**
 * Session section display labels
 */
export const SESSION_SECTION_LABELS: Record<string, string> = {
	call_to_order: "Call to Order",
	opening_prayer_invocation: "Opening Prayer/Invocation",
	national_anthem_and_pledge_of_allegiance:
		"National Anthem and Pledge of Allegiance",
	roll_call: "Roll Call",
	reading_and_or_approval_of_the_minutes:
		"Reading and/or Approval of the Minutes",
	first_reading_and_reference_of_business:
		"First Reading and References of Business of:",
	committee_reports: "Committee Reports:",
	calendar_of_business: "Calendar of Business:",
	third_reading: "Third Reading:",
	other_matters: "Other Matters:",
	closing_prayers: "Closing Prayers:",
	adjournment: "Adjournment:",
};

/**
 * Ordered list of session sections for UI display
 */
export const SESSION_SECTION_ORDER: string[] = [
	"call_to_order",
	"opening_prayer_invocation",
	"national_anthem_and_pledge_of_allegiance",
	"roll_call",
	"reading_and_or_approval_of_the_minutes",
	"first_reading_and_reference_of_business",
	"committee_reports",
	"calendar_of_business",
	"third_reading",
	"other_matters",
	"closing_prayers",
	"adjournment",
];

/**
 * Get the uppercase alphabetical letter for a session section (A, B, C, ...)
 */
export function getSectionLetter(section: string): string {
	const index = SESSION_SECTION_ORDER.indexOf(section);
	if (index === -1) return "";
	return String.fromCharCode(65 + index); // 65 = 'A'
}

/**
 * Format agenda item number based on section type
 * - Main sections: "A.", "B.", "C.", etc.
 * - Sub-items for any section: "e.01", "f.02", etc. (lowercase)
 * - First Reading (F): Always uses lowercase "f.01", "f.02", "f.03", etc.
 * - Committee Reports (G): Uses hierarchical formatting
 *   - Committee headings: "1.", "2.", etc.
 *   - Items under committees: "a.", "b.", etc.
 * @param section The session section enum value
 * @param itemIndex The index of the item within the section (0-based)
 * @param isSubItem Whether this is a sub-item (for hierarchical sections)
 * @param parentIndex Optional parent item index for sub-items
 */
export function formatAgendaItemNumber(
	section: string,
	itemIndex: number,
	isSubItem = false,
	parentIndex?: number,
): string {
	const letter = getSectionLetter(section);
	if (!letter) return "";

	// Sub-items always get lowercase two-digit numbering: e.01, f.01, g.01, etc.
	if (isSubItem) {
		const num = String(itemIndex + 1).padStart(2, "0");
		return `${letter.toLowerCase()}.${num}`;
	}

	// First Reading: f.01, f.02, f.03, etc. (lowercase)
	if (section === "first_reading_and_reference_of_business") {
		const num = String(itemIndex + 1).padStart(2, "0");
		return `${letter.toLowerCase()}.${num}`;
	}

	// Committee Reports: Hierarchical numbering
	if (section === "committee_reports") {
		if (typeof parentIndex === "number") {
			// Sub-items under a committee: a., b., c., etc.
			const subLetter = String.fromCharCode(97 + itemIndex); // 97 = 'a'
			return `${subLetter}.`;
		}
		// Main committee items: 1., 2., 3., etc.
		return `${itemIndex + 1}.`;
	}

	// Default: Just the letter (A., B., C., etc.)
	return `${letter}.`;
}

/**
 * Check if a section uses sub-item formatting
 */
export function sectionUsesSubItems(section: string): boolean {
	return (
		section === "first_reading_and_reference_of_business" ||
		section === "committee_reports"
	);
}

/**
 * Format full agenda item display with number and title
 * @param section The session section enum value
 * @param title The agenda item title
 * @param itemIndex The index within the section
 * @param isSubItem Whether this is a sub-item
 * @param parentIndex Optional parent index for sub-items
 */
export function formatAgendaItemDisplay(
	section: string,
	title: string,
	itemIndex: number,
	isSubItem = false,
	parentIndex?: number,
): string {
	const number = formatAgendaItemNumber(
		section,
		itemIndex,
		isSubItem,
		parentIndex,
	);

	// For committee reports, if it's a main item and title doesn't start with "Committee",
	// prepend "Committee Report on"
	if (
		section === "committee_reports" &&
		!isSubItem &&
		!title.toLowerCase().startsWith("committee")
	) {
		return `${number} Committee Report on ${title}`;
	}

	return `${number} ${title}`;
}

/**
 * Session types for filtering (used in UI dropdowns)
 */
export const SESSION_TYPES = [
	{ value: "regular", label: "Regular Session" },
	{ value: "special", label: "Special Session" },
] as const;

/**
 * Session statuses for filtering (used in UI dropdowns)
 */
export const SESSION_STATUSES = [
	{ value: "scheduled", label: "Scheduled" },
	{ value: "completed", label: "Completed" },
] as const;

/**
 * Badge color classes for session types
 */
export const SESSION_TYPE_BADGE_COLORS: Record<string, string> = {
	regular: "bg-[#dc2626]",
	special: "bg-[#fe9a00]",
};

/**
 * Badge color classes for session statuses
 */
export const SESSION_STATUS_BADGE_COLORS: Record<string, string> = {
	completed: "bg-[#16a34a]",
	scheduled: "bg-[#3b82f6]",
	draft: "bg-[#f59e0b]",
};

/**
 * Get the display label for a session type
 */
export function getSessionTypeLabel(type: string): string {
	return SESSION_TYPE_LABELS[type] || type;
}

/**
 * Get the display label for a session status
 */
export function getSessionStatusLabel(status: string): string {
	return SESSION_STATUS_LABELS[status] || status;
}

/**
 * Get badge color class for session type
 */
export function getSessionTypeBadgeClass(type: string): string {
	return SESSION_TYPE_BADGE_COLORS[type] || "bg-gray-500";
}

/**
 * Get badge color class for session status
 */
export function getSessionStatusBadgeClass(status: string): string {
	return SESSION_STATUS_BADGE_COLORS[status] || "bg-gray-500";
}

/**
 * Get the display label for a session section
 */
export function getSectionLabel(section: string): string {
	return SESSION_SECTION_LABELS[section] || section;
}

/**
 * Document type badge colors for better visual distinction
 */
export const DOCUMENT_TYPE_BADGE_COLORS: Record<string, string> = {
	ordinance: "bg-blue-100 text-blue-800",
	resolution: "bg-green-100 text-green-800",
};

/**
 * Human-readable labels for document classification enum values.
 * Converts snake_case DB values to title-case labels.
 */
const CLASSIFICATION_LABELS: Record<string, string> = {
	agriculture_fisheries_aquatic_and_natural_resources:
		"Agriculture, Fisheries, Aquatic & Natural Resources",
	animal_welfare: "Animal Welfare",
	appropriations: "Appropriations",
	barangay_affairs_and_community_development:
		"Barangay Affairs & Community Development",
	communication_and_public_information: "Communication & Public Information",
	cooperatives_and_livelihood: "Cooperatives & Livelihood",
	disaster_relief_or_disaster_management:
		"Disaster Relief / Disaster Management",
	disaster_relief_disaster_management: "Disaster Relief / Disaster Management",
	domestic_and_international_relations: "Domestic & International Relations",
	education_science_and_technology: "Education, Science & Technology",
	energy_and_public_utilities: "Energy & Public Utilities",
	engineering_construction_and_public_works:
		"Engineering, Construction & Public Works",
	games_amusement_and_professional_sports:
		"Games, Amusement & Professional Sports",
	good_government_and_public_accountability_blue_ribbon_committee:
		"Good Government & Public Accountability (Blue Ribbon Committee)",
	health_sanitation_and_hospital_services:
		"Health, Sanitation & Hospital Services",
	information_technology_and_computerization:
		"Information Technology & Computerization",
	labor_employment_manpower_development_and_placement:
		"Labor, Employment, Manpower Development & Placement",
	local_accreditation: "Local Accreditation",
	markets_and_slaughterhouse: "Markets & Slaughterhouse",
	moral_recovery: "Moral Recovery",
	police_fire_penology_ps_os_ddr: "Police, Fire, Penology (PS/OS/DDR)",
	public_services_environmental_protection_and_ecology:
		"Public Services, Environmental Protection & Ecology",
	rules_ordinances_resolutions_style_justice_and_legal_affairs:
		"Rules, Ordinances, Resolutions, Style, Justice & Legal Affairs",
	social_services: "Social Services",
	tourism_culture_and_historical_affairs:
		"Tourism, Culture & Historical Affairs",
	trade_commerce_and_industry: "Trade, Commerce & Industry",
	transportation: "Transportation",
	urban_planning_housing_ld_zoning_expropriation_aala:
		"Urban Planning, Housing, LD, Zoning, Expropriation (AALA)",
	urban_poor_human_rights_and_minority_groups:
		"Urban Poor, Human Rights & Minority Groups",
	veterans_retirees_elderly_and_disabled_person:
		"Veterans, Retirees, Elderly & Disabled Person",
	ways_and_means: "Ways & Means",
	women_and_family_relations: "Women & Family Relations",
	youth_and_sports_development: "Youth & Sports Development",
};

/**
 * Get human-readable label for a document classification enum value
 */
export function getClassificationLabel(classification: string): string {
	return (
		CLASSIFICATION_LABELS[classification] ??
		classification.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
	);
}

/**
 * Get badge color class for document type
 */
export function getDocumentTypeBadgeClass(type: string): string {
	const typeLower = type.toLowerCase();
	if (typeLower.includes("ordinance")) {
		return DOCUMENT_TYPE_BADGE_COLORS.ordinance!;
	}
	if (typeLower.includes("resolution")) {
		return DOCUMENT_TYPE_BADGE_COLORS.resolution!;
	}
	return "bg-gray-100 text-gray-700 border-gray-200";
}
