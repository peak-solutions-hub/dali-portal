import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import type {
	GetLegislativeDocumentListInput,
	LegislativeDocumentListResponse,
	LegislativeDocumentWithDetails,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import type { Prisma } from "@/generated/prisma/client";

@Injectable()
export class LegislativeDocumentsService {
	constructor(private readonly db: DbService) {}

	async findAll(
		input: GetLegislativeDocumentListInput,
	): Promise<LegislativeDocumentListResponse> {
		const { search, type, year, classification, page = 1, limit = 10 } = input;

		// Build where clause
		const where: Prisma.LegislativeDocumentWhereInput = {};

		if (type) {
			where.type = type;
		}

		if (year) {
			where.seriesYear = year;
		}

		if (classification) {
			where.document = {
				classification: classification as Prisma.EnumClassificationTypeFilter,
			};
		}

		if (search) {
			where.OR = [
				{ officialNumber: { contains: search, mode: "insensitive" } },
				{ document: { title: { contains: search, mode: "insensitive" } } },
				{ authorNames: { has: search } },
				{ sponsorNames: { has: search } },
			];
		}

		// Get total count for pagination
		const totalItems = await this.db.legislativeDocument.count({ where });

		// Fetch documents with related data
		const documents = await this.db.legislativeDocument.findMany({
			where,
			include: {
				document: true,
			},
			orderBy: {
				createdAt: "desc",
			},
			skip: (page - 1) * limit,
			take: limit,
		});

		const totalPages = Math.ceil(totalItems / limit);

		// Transform to response format
		const transformedDocs: LegislativeDocumentWithDetails[] = documents.map(
			(doc) => ({
				id: Number(doc.id),
				documentId: doc.documentId,
				officialNumber: doc.officialNumber,
				seriesYear: Number(doc.seriesYear),
				type: doc.type as
					| "proposed_ordinance"
					| "proposed_resolution"
					| "committee_report",
				dateEnacted: doc.dateEnacted,
				createdAt: doc.createdAt,
				sponsorNames:
					doc.sponsorNames && doc.sponsorNames.length > 0
						? doc.sponsorNames
						: null,
				authorNames:
					doc.authorNames && doc.authorNames.length > 0
						? doc.authorNames
						: null,
				document: {
					id: doc.document.id,
					codeNumber: doc.document.codeNumber,
					title: doc.document.title,
					type: doc.document.type as string,
					purpose: doc.document.purpose as string,
					source: doc.document.source as string,
					status: doc.document.status as string,
					classification: doc.document.classification as string,
					remarks: doc.document.remarks ?? null,
					receivedAt: doc.document.receivedAt,
				},
				displayTitle: doc.document.title,
				displayType: this.getDisplayType(doc.type),
				displayClassification: doc.document.classification,
			}),
		);

		return {
			documents: transformedDocs,
			pagination: {
				currentPage: page,
				totalPages,
				totalItems,
				itemsPerPage: limit,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		};
	}

	async findOne(id: number): Promise<LegislativeDocumentWithDetails> {
		const document = await this.db.legislativeDocument.findUnique({
			where: { id: BigInt(id) },
			include: {
				document: true,
			},
		});

		if (!document) {
			throw new ORPCError("NOT_FOUND", {
				message: "Legislative document not found",
			});
		}

		return {
			id: Number(document.id),
			documentId: document.documentId,
			officialNumber: document.officialNumber,
			seriesYear: Number(document.seriesYear),
			type: document.type as
				| "proposed_ordinance"
				| "proposed_resolution"
				| "committee_report",
			dateEnacted: document.dateEnacted,
			createdAt: document.createdAt,
			sponsorNames:
				document.sponsorNames && document.sponsorNames.length > 0
					? document.sponsorNames
					: null,
			authorNames:
				document.authorNames && document.authorNames.length > 0
					? document.authorNames
					: null,
			document: {
				id: document.document.id,
				codeNumber: document.document.codeNumber,
				title: document.document.title,
				type: document.document.type,
				purpose: document.document.purpose,
				source: document.document.source,
				status: document.document.status,
				classification: document.document.classification,
				remarks: document.document.remarks ?? null,
				receivedAt: document.document.receivedAt,
			},
			displayTitle: document.document.title,
			displayType: this.getDisplayType(document.type),
			displayClassification: document.document.classification,
		};
	}

	private getDisplayType(type: string): string {
		const typeMap: Record<string, string> = {
			proposed_ordinance: "Proposed Ordinance",
			proposed_resolution: "Proposed Resolution",
			committee_report: "Committee Report",
		};
		return typeMap[type] || "Unknown";
	}

	/**
	 * Get statistics for home page
	 */
	async getStatistics(): Promise<{
		totalOrdinances: number;
		totalResolutions: number;
	}> {
		const [ordinances, resolutions] = await Promise.all([
			this.db.legislativeDocument.count({
				where: { type: "proposed_ordinance" },
			}),
			this.db.legislativeDocument.count({
				where: { type: "proposed_resolution" },
			}),
		]);

		return {
			totalOrdinances: ordinances,
			totalResolutions: resolutions,
		};
	}

	/**
	 * Get latest documents for home page
	 */
	async getLatestDocuments(
		limit = 5,
	): Promise<LegislativeDocumentListResponse> {
		const documents = await this.db.legislativeDocument.findMany({
			where: {
				type: {
					in: ["proposed_ordinance", "proposed_resolution"],
				},
			},
			include: {
				document: true,
			},
			orderBy: {
				dateEnacted: "desc",
			},
			take: limit,
		});

		const mappedDocuments: LegislativeDocumentWithDetails[] = documents.map(
			(doc) => ({
				id: Number(doc.id),
				documentId: doc.documentId,
				officialNumber: doc.officialNumber,
				seriesYear: Number(doc.seriesYear),
				type: doc.type as
					| "proposed_ordinance"
					| "proposed_resolution"
					| "committee_report",
				dateEnacted: doc.dateEnacted,
				createdAt: doc.createdAt,
				sponsorNames:
					doc.sponsorNames && doc.sponsorNames.length > 0
						? doc.sponsorNames
						: null,
				authorNames:
					doc.authorNames && doc.authorNames.length > 0
						? doc.authorNames
						: null,
				document: {
					id: doc.document.id,
					codeNumber: doc.document.codeNumber,
					title: doc.document.title,
					type: doc.document.type as string,
					purpose: doc.document.purpose as string,
					source: doc.document.source as string,
					status: doc.document.status as string,
					classification: doc.document.classification as string,
					remarks: doc.document.remarks ?? null,
					receivedAt: doc.document.receivedAt,
				},
				displayTitle: doc.document.title,
				displayType: this.getDisplayType(doc.type),
				displayClassification: doc.document.classification,
			}),
		);

		return {
			documents: mappedDocuments,
			pagination: {
				currentPage: 1,
				totalPages: 1,
				totalItems: mappedDocuments.length,
				itemsPerPage: limit,
				hasNextPage: false,
				hasPreviousPage: false,
			},
		};
	}
}
