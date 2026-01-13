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

// Committee classifications for document tagging
export const ClassificationType = {
	AGRICULTURE_FISHERIES_AQUATIC_AND_NATURAL_RESOURCES:
		"agriculture_fisheries_aquatic_and_natural_resources",
	ANIMAL_WELFARE: "animal_welfare",
	APPROPRIATIONS: "appropriations",
	BARANGAY_AFFAIRS_AND_COMMUNITY_DEVELOPMENT:
		"barangay_affairs_and_community_development",
	COMMUNICATION_AND_PUBLIC_INFORMATION: "communication_and_public_information",
	COOPERATIVES_AND_LIVELIHOOD: "cooperatives_and_livelihood",
	DISASTER_RELIEF_OR_DISASTER_MANAGEMENT:
		"disaster_relief_or_disaster_management",
	DOMESTIC_AND_INTERNATIONAL_RELATIONS: "domestic_and_international_relations",
	EDUCATION_SCIENCE_AND_TECHNOLOGY: "education_science_and_technology",
	ENERGY_AND_PUBLIC_UTILITIES: "energy_and_public_utilities",
	ENGINEERING_CONSTRUCTION_AND_PUBLIC_WORKS:
		"engineering_construction_and_public_works",
	GAMES_AMUSEMENT_AND_PROFESSIONAL_SPORTS:
		"games_amusement_and_professional_sports",
	GOOD_GOVERNMENT_AND_PUBLIC_ACCOUNTABILITY_BLUE_RIBBON_COMMITTEE:
		"good_government_and_public_accountability_blue_ribbon_committee",
	HEALTH_SANITATION_AND_HOSPITAL_SERVICES:
		"health_sanitation_and_hospital_services",
	INFORMATION_TECHNOLOGY_AND_COMPUTERIZATION:
		"information_technology_and_computerization",
	LABOR_EMPLOYMENT_MANPOWER_DEVELOPMENT_AND_PLACEMENT:
		"labor_employment_manpower_development_and_placement",
	LOCAL_ACCREDITATION: "local_accreditation",
	MARKETS_AND_SLAUGHTERHOUSE: "markets_and_slaughterhouse",
	MORAL_RECOVERY: "moral_recovery",
	POLICE_FIRE_PENOLOGY_PS_OS_DDR: "police_fire_penology_ps_os_ddr",
	PUBLIC_SERVICES_ENVIRONMENTAL_PROTECTION_AND_ECOLOGY:
		"public_services_environmental_protection_and_ecology",
	RULES_ORDINANCES_RESOLUTIONS_STYLE_JUSTICE_AND_LEGAL_AFFAIRS:
		"rules_ordinances_resolutions_style_justice_and_legal_affairs",
	SOCIAL_SERVICES: "social_services",
	TOURISM_CULTURE_AND_HISTORICAL_AFFAIRS:
		"tourism_culture_and_historical_affairs",
	TRADE_COMMERCE_AND_INDUSTRY: "trade_commerce_and_industry",
	TRANSPORTATION: "transportation",
	URBAN_PLANNING_HOUSING_LD_ZONING_EXPROPRIATION_AALA:
		"urban_planning_housing_ld_zoning_expropriation_aala",
	URBAN_POOR_HUMAN_RIGHTS_AND_MINORITY_GROUPS:
		"urban_poor_human_rights_and_minority_groups",
	VETERANS_RETIREES_ELDERLY_AND_DISABLED_PERSON:
		"veterans_retirees_elderly_and_disabled_person",
	WAYS_AND_MEANS: "ways_and_means",
	WOMEN_AND_FAMILY_RELATIONS: "women_and_family_relations",
	YOUTH_AND_SPORTS_DEVELOPMENT: "youth_and_sports_development",
} as const;

export type ClassificationType =
	(typeof ClassificationType)[keyof typeof ClassificationType];
export const CLASSIFICATION_TYPE_VALUES: ClassificationType[] =
	Object.values(ClassificationType);
