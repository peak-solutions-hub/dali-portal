import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import type {
	GetLegislativeDocumentListInput,
	LegislativeDocumentListResponse,
	LegislativeDocumentWithDetails,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import {
	getLatestVersionFilePath,
	type LegislativeDocumentWithRelations,
	transformLegislativeDocument,
	transformPagination,
} from "@/app/legislative-documents/pipes";
import { StorageService } from "@/app/storage/storage.service";
import type { Prisma } from "@/generated/prisma/client";

const LEGISLATIVE_DOCUMENT_INCLUDE = {
	document: {
		include: {
			documentVersion: {
				orderBy: { versionNumber: "desc" as const },
				take: 1,
			},
		},
	},
} satisfies Prisma.LegislativeDocumentInclude;

@Injectable()
export class LegislativeDocumentsService {
	constructor(
		private readonly db: DbService,
		private readonly storage: StorageService,
	) {}

	private async generatePdfUrl(filePath?: string): Promise<string | undefined> {
		if (!filePath) return undefined;

		try {
			return await this.storage.getSignedUrl("documents", filePath, 3600);
		} catch (error) {
			console.error("Failed to generate signed URL:", error);
			return undefined;
		}
	}

	private async toResponse(
		doc: LegislativeDocumentWithRelations,
	): Promise<LegislativeDocumentWithDetails> {
		const filePath = getLatestVersionFilePath(doc);
		const pdfUrl = await this.generatePdfUrl(filePath);
		return transformLegislativeDocument(doc, pdfUrl);
	}

	async findAll(
		input: GetLegislativeDocumentListInput,
	): Promise<LegislativeDocumentListResponse> {
		const { search, type, year, classification, page = 1, limit = 10 } = input;

		const where = this.buildWhereClause({ search, type, year, classification });
		const totalItems = await this.db.legislativeDocument.count({ where });

		const documents = await this.db.legislativeDocument.findMany({
			where,
			include: LEGISLATIVE_DOCUMENT_INCLUDE,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * limit,
			take: limit,
		});

		const transformedDocs = await Promise.all(
			documents.map((doc) => this.toResponse(doc)),
		);

		return {
			documents: transformedDocs,
			pagination: transformPagination({ page, limit, totalItems }),
		};
	}

	async findOne(id: number): Promise<LegislativeDocumentWithDetails> {
		const document = await this.db.legislativeDocument.findUnique({
			where: { id: BigInt(id) },
			include: LEGISLATIVE_DOCUMENT_INCLUDE,
		});

		if (!document) {
			throw new ORPCError("NOT_FOUND", {
				message: "Legislative document not found",
			});
		}

		return this.toResponse(document);
	}

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

	async getLatestDocuments(
		limit = 5,
	): Promise<LegislativeDocumentListResponse> {
		const documents = await this.db.legislativeDocument.findMany({
			where: {
				type: { in: ["proposed_ordinance", "proposed_resolution"] },
			},
			include: LEGISLATIVE_DOCUMENT_INCLUDE,
			orderBy: { id: "desc" },
			take: limit,
		});

		const transformedDocs = await Promise.all(
			documents.map((doc) => this.toResponse(doc)),
		);

		return {
			documents: transformedDocs,
			pagination: transformPagination({
				page: 1,
				limit,
				totalItems: transformedDocs.length,
			}),
		};
	}

	private buildWhereClause(params: {
		search?: string;
		type?: string;
		year?: number;
		classification?: string;
	}): Prisma.LegislativeDocumentWhereInput {
		const { search, type, year, classification } = params;
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

		return where;
	}
}
