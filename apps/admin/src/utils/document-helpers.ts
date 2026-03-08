import type {
	ClassificationTypeEnumType,
	DocumentTypeEnumType,
	PurposeTypeEnumType,
	SourceTypeEnumType,
	StatusTypeEnumType,
} from "@repo/shared";

function humanize(value: string): string {
	return value
		.split("_")
		.map((token) => token.charAt(0).toUpperCase() + token.slice(1))
		.join(" ");
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
