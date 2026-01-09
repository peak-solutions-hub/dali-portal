export const DocumentType = {
	// Legislative Documents (go through Sessions)
	PROPOSED_ORDINANCE: "proposed_ordinance",
	PROPOSED_RESOLUTION: "proposed_resolution",

	// not included
	COMMITTEE_REPORT: "committee_report",

	// Administrative Documents (internal processing)
	PAYROLL: "payroll",
	CONTRACT_OF_SERVICE: "contract_of_service",
	LEAVE_APPLICATION: "leave_application",

	LETTER: "letter",
	MEMO: "memo",
	ENDORSEMENT: "endorsement",

	INVITATION: "invitation",
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
export const DOCUMENT_TYPE_VALUES: DocumentType[] = Object.values(DocumentType);

export const PurposeType = {
	FOR_AGENDA: "for_agenda",
	FOR_ACTION: "for_action",
	FOR_FILING: "for_filing",
	FOR_CALLER_SLIP: "for_caller_slip",
} as const;

export type PurposeType = (typeof PurposeType)[keyof typeof PurposeType];
export const PURPOSE_TYPE_VALUES: PurposeType[] = Object.values(PurposeType);

export const StatusType = {
	/** Document has been logged into the system */
	RECEIVED: "received",

	/** Awaiting initial review/initialing by staff */
	FOR_INITIAL: "for_initial",

	/** Awaiting signature from the Vice Mayor */
	FOR_SIGNATURE: "for_signature",

	/** Document has been signed/approved */
	APPROVED: "approved",

	/** (Legislative) Added to session calendar */
	CALENDARED: "calendared",

	/** (Legislative) Published after session */
	PUBLISHED: "published",

	/** Document was returned for corrections */
	RETURNED: "returned",

	/** Document has been released to claimant/filed */
	RELEASED: "released",
} as const;

export type StatusType = (typeof StatusType)[keyof typeof StatusType];
export const STATUS_TYPE_VALUES: StatusType[] = Object.values(StatusType);

export const SourceType = {
	ADMINISTRATORS_OFFICE: "administrators_office",
	CITY_COUNCILORS_OFFICE: "city_councilors_office",
	CITY_TREASURERS_OFFICE: "city_treasurers_office",
	HEALTH_OFFICE: "health_office",
	MAYORS_OFFICE: "mayors_office",
	MDRRMO: "mdrrmo",
	PNP: "philippine_national_police",
	VMO: "vice_mayors_office",
	OTHERS: "others",
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];
export const SOURCE_TYPE_VALUES: SourceType[] = Object.values(SourceType);

// for document tagging
export const ClassificationType = {
	APPROPRIATIONS: "appropriations",
	BARANGAY_AFFAIRS_AND_COMMUNITY_DEVELOPMENT:
		"barangay_affairs_and_community_development",
	COMMUNICATION_AND_PUBLIC_INFORMATION: "communication_and_public_information",
	COOPERATIVE_AND_LIVELIHOOD: "cooperative_and_livelihood",
	DISASTER_RELIEF: "disaster_relief",
	DOMESTIC_AND_INTERNATIONAL_RELATIONS: "domestic_and_international_relations",
	EDUCATION_SCIENCE_AND_TECHNOLOGY: "education_science_and_technology",
	ELECTRIC_GAS_AND_UTILITIES: "electric_gas_and_utilities",
	ENGINEERING_CONSTRUCTION_AND_PUBLIC_WORKS:
		"engineering_construction_and_public_works",
	ETHICS_AND_RULES_OF_PROFESSIONAL_SPORTS:
		"ethics_and_rules_of_professional_sports",
	FIRE_SANITATION_AND_HOSPITAL_SERVICES:
		"fire_sanitation_and_hospital_services",
	INFORMATION_TECHNOLOGY_AND_COMPUTERIZATION:
		"information_technology_and_computerization",
	LABOR_EMPLOYMENT_MANPOWER_DEVELOPMENT_AND_PERSONNEL:
		"labor_employment_manpower_development_and_personnel",
	MARKET_AND_SLAUGHTERHOUSE: "market_and_slaughterhouse",
	PEACE_AND_ORDER: "peace_and_order",
	PUBLIC_SAFETY_GOOD_GOVERNMENT_AND_PUBLIC_ACCOUNTABILITY:
		"public_safety_good_government_and_public_accountability",
	PUBLIC_FIRE_PENOLOGY_PUBLIC_SAFETY_ORDER_AND_SECURITY:
		"public_fire_penology_public_safety_order_and_security",
	PUBLIC_SERVICES_ENVIRONMENTAL_PROTECTION_AND_ECOLOGY:
		"public_services_environmental_protection_and_ecology",
	PUBLIC_UTILITIES_ENERGY_STYLE_JUSTICE_AND_LEGAL_MATTERS:
		"public_utilities_energy_style_justice_and_legal_matters",
	REAL_ESTATE: "real_estate",
	SOCIAL_WELFARE_AND_HISTORICAL_AFFAIRS:
		"social_welfare_and_historical_affairs",
	TOURISM_CULTURE_AND_INDUSTRY: "tourism_culture_and_industry",
	TRADE_COMMERCE_AND_INDUSTRY: "trade_commerce_and_industry",
	TRANSPORTATION_HOUSING_AND_LAND_DEVELOPMENT_ZONING:
		"transportation_housing_and_land_development_zoning",
	URBAN_POOR_HUMAN_RIGHTS_AND_MINORITY_GROUPS:
		"urban_poor_human_rights_and_minority_groups",
	VETERANS_RETIREES_ELDERLY_AND_DISABLED_PERSON:
		"veterans_retirees_elderly_and_disabled_person",
	WOMEN_AND_FAMILY_RELATIONS: "women_and_family_relations",
	YOUTH_AND_SPORTS_DEVELOPMENT: "youth_and_sports_development",
} as const;

export type ClassificationType =
	(typeof ClassificationType)[keyof typeof ClassificationType];
export const CLASSIFICATION_TYPE_VALUES: ClassificationType[] =
	Object.values(ClassificationType);
