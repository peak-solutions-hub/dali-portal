/**
 * UI-specific constants and helpers for Legislative Sessions (Shared UI package)
 * These are presentation-layer utilities used for display and styling.
 */

/* ============================
   Session Type
   ============================ */

export const SESSION_TYPE_LABELS: Record<string, string> = {
	regular: "Regular Session",
	special: "Special Session",
};

/** Dropdown options derived from SESSION_TYPE_LABELS — keeps values in sync automatically. */
export const SESSION_TYPES = Object.entries(SESSION_TYPE_LABELS).map(
	([value, label]) => ({ value, label }),
) as { value: string; label: string }[];

export const SESSION_TYPE_BADGE_COLORS: Record<string, string> = {
	regular: "bg-[#dc2626]",
	special: "bg-[#fe9a00]",
};

export function getSessionTypeLabel(type: string): string {
	return SESSION_TYPE_LABELS[type] || type;
}

export function getSessionTypeBadgeClass(type: string): string {
	return SESSION_TYPE_BADGE_COLORS[type] || "bg-gray-500";
}

/* ============================
   Session Status
   ============================ */

export const SESSION_STATUS_LABELS: Record<string, string> = {
	draft: "Draft",
	scheduled: "Scheduled",
	completed: "Completed",
};

/**
 * Public-facing dropdown options — excludes "draft" which is admin-only.
 * Derived from SESSION_STATUS_LABELS to stay in sync with label text.
 */
export const SESSION_STATUSES = (["scheduled", "completed"] as const).map(
	(value) => ({ value, label: SESSION_STATUS_LABELS[value]! }),
);

export const SESSION_STATUS_BADGE_COLORS: Record<string, string> = {
	draft: "bg-[#f59e0b]",
	scheduled: "bg-[#3b82f6]",
	completed: "bg-[#16a34a]",
};

export function getSessionStatusLabel(status: string): string {
	return SESSION_STATUS_LABELS[status] || status;
}

export function getSessionStatusBadgeClass(status: string): string {
	return SESSION_STATUS_BADGE_COLORS[status] || "bg-gray-500";
}

/* ============================
   Session Sections
   ============================ */

/**
 * Single source of truth for session sections.
 * Order here determines the section letter (A, B, C, ...) used throughout the UI.
 * SESSION_SECTION_ORDER and SESSION_SECTION_LABELS are both derived from this.
 */
const SESSION_SECTIONS: [key: string, label: string][] = [
	["call_to_order", "Call to Order"],
	["opening_prayer_invocation", "Opening Prayer/Invocation"],
	[
		"national_anthem_and_pledge_of_allegiance",
		"National Anthem and Pledge of Allegiance",
	],
	["roll_call", "Roll Call"],
	[
		"reading_and_or_approval_of_the_minutes",
		"Reading and/or Approval of the Minutes",
	],
	[
		"first_reading_and_reference_of_business",
		"First Reading and References of Business of:",
	],
	["committee_reports", "Committee Reports:"],
	["calendar_of_business", "Calendar of Business:"],
	["third_reading", "Third Reading:"],
	["other_matters", "Other Matters:"],
	["closing_prayers", "Closing Prayers:"],
	["adjournment", "Adjournment:"],
];

/** Ordered list of section keys — letter A maps to index 0, B to index 1, etc. */
export const SESSION_SECTION_ORDER: string[] = SESSION_SECTIONS.map(
	([key]) => key,
);

export const SESSION_SECTION_LABELS: Record<string, string> =
	Object.fromEntries(SESSION_SECTIONS);

/**
 * Default agenda items for the agenda builder, one per section.
 * Titles are derived from section labels with trailing punctuation stripped.
 */
export const DEFAULT_AGENDA_ITEMS = SESSION_SECTIONS.map(
	([section, label], index) => ({
		id: section,
		title: `${String.fromCharCode(65 + index)}. ${label.replace(/\s+of:$/, "").replace(/:$/, "")}`,
		section,
		orderIndex: index,
	}),
);

export type AgendaItem = (typeof DEFAULT_AGENDA_ITEMS)[number];

export function getSectionLabel(section: string): string {
	return SESSION_SECTION_LABELS[section] || section;
}

/** Returns the uppercase letter (A–L) corresponding to a section's position. */
export function getSectionLetter(section: string): string {
	const index = SESSION_SECTION_ORDER.indexOf(section);
	if (index === -1) return "";
	return String.fromCharCode(65 + index); // 65 = 'A'
}

/** Returns true for sections that use numbered/lettered sub-item formatting. */
export function sectionUsesSubItems(section: string): boolean {
	return (
		section === "first_reading_and_reference_of_business" ||
		section === "committee_reports"
	);
}

/**
 * Returns the formatted agenda item number for a given section and position.
 *
 * Rules:
 * - Default sections:              "A.", "B.", etc.
 * - First Reading (F):             "f.01", "f.02", etc.
 * - Sub-items (any section):       "e.01", "f.02", etc.
 * - Committee Reports main items:  "1.", "2.", etc.
 * - Committee Reports sub-items:   "a.", "b.", etc.
 */
export function formatAgendaItemNumber(
	section: string,
	itemIndex: number,
	isSubItem = false,
	parentIndex?: number,
): string {
	const letter = getSectionLetter(section);
	if (!letter) return "";

	if (isSubItem) {
		const num = String(itemIndex + 1).padStart(2, "0");
		return `${letter.toLowerCase()}.${num}`;
	}

	if (section === "first_reading_and_reference_of_business") {
		const num = String(itemIndex + 1).padStart(2, "0");
		return `${letter.toLowerCase()}.${num}`;
	}

	if (section === "committee_reports") {
		if (typeof parentIndex === "number") {
			return `${String.fromCharCode(97 + itemIndex)}.`; // a., b., c., ...
		}
		return `${itemIndex + 1}.`; // 1., 2., 3., ...
	}

	return `${letter}.`;
}

/**
 * Returns the full display string combining the item number and title.
 * Committee report main items are automatically prefixed with "Committee Report on"
 * if the title doesn't already start with "committee".
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

	if (
		section === "committee_reports" &&
		!isSubItem &&
		!title.toLowerCase().startsWith("committee")
	) {
		return `${number} Committee Report on ${title}`;
	}

	return `${number} ${title}`;
}

/* ============================
   Document Types
   ============================ */

export const DOCUMENT_TYPE_BADGE_COLORS: Record<string, string> = {
	ordinance: "bg-blue-100 text-blue-800",
	resolution: "bg-green-100 text-green-800",
};

export function getDocumentTypeBadgeClass(type: string): string {
	const typeLower = type.toLowerCase();
	for (const [key, cls] of Object.entries(DOCUMENT_TYPE_BADGE_COLORS)) {
		if (typeLower.includes(key)) return cls;
	}
	return "bg-gray-100 text-gray-700 border-gray-200";
}

/* ============================
   Document Classification
   ============================ */

/**
 * Human-readable labels for document classification enum values.
 *
 * Note: "disaster_relief_or_disaster_management" and "disaster_relief_disaster_management"
 * are both present because the DB has two inconsistent enum variants for the same concept.
 * Both are mapped to the same label until the DB enum is consolidated.
 */
export const CLASSIFICATION_LABELS: Record<string, string> = {
	agriculture_fisheries_aquatic_and_natural_resources:
		"Agriculture, Fisheries, Aquatic & Natural Resources",
	animal_welfare: "Animal Welfare",
	appropriations: "Appropriations",
	barangay_affairs_and_community_development:
		"Barangay Affairs & Community Development",
	communication_and_public_information: "Communication & Public Information",
	cooperatives_and_livelihood: "Cooperatives & Livelihood",
	// Two variants exist in the DB for the same concept — keep both until enum is cleaned up
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

/** Returns a human-readable label for a classification key, falling back to a title-cased version of the key. */
export function getClassificationLabel(
	classification: string | null | undefined,
): string {
	if (!classification) return "Uncategorized";
	return (
		CLASSIFICATION_LABELS[classification] ??
		classification.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
	);
}
