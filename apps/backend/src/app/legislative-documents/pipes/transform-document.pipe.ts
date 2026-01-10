import type {
	Document,
	DocumentVersion,
	LegislativeDocumentWithDetails,
	PaginationInfo,
} from "@repo/shared";
import type { Prisma } from "@/generated/prisma/client";

export type LegislativeDocumentWithRelations =
	Prisma.LegislativeDocumentGetPayload<{
		include: {
			document: {
				include: {
					documentVersion: true;
				};
			};
		};
	}>;

const DOCUMENT_TYPE_DISPLAY_MAP: Record<string, string> = {
	ordinance: "Ordinance",
	resolution: "Resolution",
};

type LegislativeDocumentType = "ordinance" | "resolution";

function transformDocument(
	doc: LegislativeDocumentWithRelations["document"],
): Document {
	return {
		id: doc.id,
		codeNumber: doc.codeNumber,
		title: doc.title,
		type: doc.type,
		purpose: doc.purpose,
		source: doc.source,
		status: doc.status,
		classification: doc.classification,
		remarks: doc.remarks ?? null,
		receivedAt: doc.receivedAt,
	};
}

function transformDocumentVersion(
	version: LegislativeDocumentWithRelations["document"]["documentVersion"][number],
): DocumentVersion {
	return {
		id: version.id,
		documentId: version.documentId,
		uploaderId: version.uploaderId,
		versionNumber: Number(version.versionNumber),
		filePath: version.filePath,
		createdAt: version.createdAt,
	};
}

export function transformLegislativeDocument(
	doc: LegislativeDocumentWithRelations,
): LegislativeDocumentWithDetails {
	const latestVersion = doc.document.documentVersion[0];
	const storagePath = latestVersion?.filePath;

	return {
		id: Number(doc.id),
		documentId: doc.documentId,
		officialNumber: doc.officialNumber,
		seriesYear: Number(doc.seriesYear),
		type: doc.type as LegislativeDocumentType,
		dateEnacted: doc.dateEnacted,
		createdAt: doc.createdAt,
		sponsorNames:
			doc.sponsorNames && doc.sponsorNames.length > 0 ? doc.sponsorNames : null,
		authorNames:
			doc.authorNames && doc.authorNames.length > 0 ? doc.authorNames : null,
		document: transformDocument(doc.document),
		displayTitle: doc.document.title,
		displayType: DOCUMENT_TYPE_DISPLAY_MAP[doc.type] ?? "Unknown",
		displayClassification: doc.document.classification,
		storageBucket: storagePath ? "documents" : undefined,
		storagePath: storagePath,
		pdfFilename: storagePath?.split("/").pop(),
		latestVersion: latestVersion
			? transformDocumentVersion(latestVersion)
			: undefined,
	};
}

interface PaginationInput {
	page: number;
	limit: number;
	totalItems: number;
}

export function transformPagination(input: PaginationInput): PaginationInfo {
	const { page, limit, totalItems } = input;
	const totalPages = Math.ceil(totalItems / limit);

	return {
		currentPage: page,
		totalPages,
		totalItems,
		itemsPerPage: limit,
		hasNextPage: page < totalPages,
		hasPreviousPage: page > 1,
	};
}
