/**
 * Constants for Legislative Documents
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
