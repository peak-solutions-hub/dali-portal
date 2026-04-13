import type {
	ClassificationTypeEnumType,
	DocumentListTab,
	DocumentTypeEnumType,
	PurposeTypeEnumType,
	SourceTypeEnumType,
	StatusTypeEnumType,
} from "@repo/shared";
import { DOCUMENT_TYPE_VALUES } from "@repo/shared";

const TAB_TYPE_OPTIONS: Record<
	Exclude<DocumentListTab, "all">,
	DocumentTypeEnumType[]
> = {
	legislative: [
		"proposed_ordinance",
		"proposed_resolution",
		"committee_report",
	],
	administrative: [
		"payroll",
		"contract_of_service",
		"leave_application",
		"letter",
		"memo",
		"endorsement",
	],
	invitations: ["invitation"],
};

const PHT_UTC_OFFSET = "+08:00";

function humanize(value: string): string {
	return value
		.split("_")
		.map((token) => token.charAt(0).toUpperCase() + token.slice(1))
		.join(" ");
}

export function getDocumentTypesForTab(
	tab: DocumentListTab,
): DocumentTypeEnumType[] {
	if (tab === "all") {
		return [...DOCUMENT_TYPE_VALUES];
	}

	return TAB_TYPE_OPTIONS[tab];
}

export function formatDocumentType(type: DocumentTypeEnumType): string {
	return humanize(type);
}

export function formatDocumentSource(source: SourceTypeEnumType): string {
	return humanize(source);
}

export function formatDocumentStatus(status: StatusTypeEnumType): string {
	return humanize(status);
}

export function formatDocumentPurpose(purpose: PurposeTypeEnumType): string {
	return humanize(purpose);
}

export function formatDocumentClassification(
	classification: ClassificationTypeEnumType,
): string {
	return humanize(classification);
}

export function getDocumentStatusBadgeClass(
	status: StatusTypeEnumType,
): string {
	switch (status) {
		case "received":
			return "bg-gray-100 text-gray-700 border-gray-200";
		case "for_initial":
			return "bg-blue-100 text-blue-700 border-blue-200";
		case "for_signature":
			return "bg-amber-100 text-amber-700 border-amber-200";
		case "approved":
			return "bg-green-100 text-green-700 border-green-200";
		case "calendared":
			return "bg-purple-100 text-purple-700 border-purple-200";
		case "published":
			return "bg-emerald-100 text-emerald-700 border-emerald-200";
		case "returned":
			return "bg-red-100 text-red-700 border-red-200";
		case "released":
			return "bg-slate-100 text-slate-700 border-slate-200";
		default:
			return "bg-gray-100 text-gray-700 border-gray-200";
	}
}

/** Converts a date-only string to the start-of-day instant in Philippine Time. */
export function toDocumentFilterStartDate(date: string): Date {
	return new Date(`${date}T00:00:00.000${PHT_UTC_OFFSET}`);
}

/** Converts a date-only string to the end-of-day instant in Philippine Time. */
export function toDocumentFilterEndDate(date: string): Date {
	return new Date(`${date}T23:59:59.999${PHT_UTC_OFFSET}`);
}
