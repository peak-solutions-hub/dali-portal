/**
 * Constants for Legislative Documents
 */

export const CLASSIFICATIONS = [
	"Agriculture and Food",
	"Appropriation",
	"Business",
	"Civil Service / HRM",
	"Education",
	"Engineering / Infrastructure",
	"Finance",
	"Health",
	"Housing and Resettlement",
	"Legal / Judiciary",
	"Licensing and Permits",
	"Market and Slaughterhouse",
	"Parks and Recreation",
	"Public Safety",
	"Public Works",
	"Social Services",
	"Taxation",
	"Transportation",
] as const;

export const DOCUMENT_TYPES = [
	{ value: "proposed_ordinance", label: "Proposed Ordinance" },
	{ value: "proposed_resolution", label: "Proposed Resolution" },
	{ value: "committee_report", label: "Committee Report" },
] as const;

export const ITEMS_PER_PAGE = 10;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
	proposed_ordinance: "Proposed Ordinance",
	proposed_resolution: "Proposed Resolution",
	committee_report: "Committee Report",
};

export const DOCUMENT_TYPE_COLORS: Record<string, string> = {
	proposed_ordinance: "bg-blue-100 text-blue-800",
	proposed_resolution: "bg-green-100 text-green-800",
	committee_report: "bg-purple-100 text-purple-800",
};
