import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import type {
	GetLegislativeDocumentListInput,
	LegislativeDocumentListResponse,
	LegislativeDocumentWithDetails,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import {
	type LegislativeDocumentWithRelations,
	transformLegislativeDocument,
	transformPagination,
} from "@/app/legislative-documents/pipes";
import { Prisma } from "@/generated/prisma/client";

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
	constructor(private readonly db: DbService) {}

	private toResponse(
		doc: LegislativeDocumentWithRelations,
	): LegislativeDocumentWithDetails {
		return transformLegislativeDocument(doc);
	}

	async findAll(
		input: GetLegislativeDocumentListInput,
	): Promise<LegislativeDocumentListResponse> {
		const { search, type, year, classification, page = 1, limit = 10 } = input;

		const baseWhere = this.buildWhereClause({ type, year, classification });
		let where: Prisma.LegislativeDocumentWhereInput = baseWhere;

		if (search?.trim()) {
			const searchWhere = this.buildWhereClause({
				search,
				type,
				year,
				classification,
			});

			const arraySearchIds = await this.searchArrayFields(search.trim());

			if (arraySearchIds.length > 0) {
				where = {
					AND: [
						baseWhere,
						{
							OR: [...(searchWhere.OR || []), { id: { in: arraySearchIds } }],
						},
					],
				};
			} else {
				where = searchWhere;
			}
		}

		const totalItems = await this.db.legislativeDocument.count({ where });

		// Calculate total pages and validate requested page
		const totalPages = Math.ceil(totalItems / limit);
		const validatedPage =
			totalPages > 0 ? Math.min(Math.max(1, page), totalPages) : 1;

		const documents = await this.db.legislativeDocument.findMany({
			where,
			include: LEGISLATIVE_DOCUMENT_INCLUDE,
			orderBy: { createdAt: "desc" },
			skip: (validatedPage - 1) * limit,
			take: limit,
		});

		const transformedDocs = documents.map((doc) => this.toResponse(doc));

		return {
			documents: transformedDocs,
			pagination: transformPagination({
				page: validatedPage,
				limit,
				totalItems,
			}),
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
				where: { type: "ordinance" },
			}),
			this.db.legislativeDocument.count({
				where: { type: "resolution" },
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
				type: { in: ["ordinance", "resolution"] },
			},
			include: LEGISLATIVE_DOCUMENT_INCLUDE,
			orderBy: { id: "desc" },
			take: limit,
		});

		const transformedDocs = documents.map((doc) => this.toResponse(doc));

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
			];
		}

		return where;
	}

	private async searchArrayFields(searchTerm: string): Promise<bigint[]> {
		if (!searchTerm.trim()) return [];

		const results = await this.db.$queryRaw<{ id: bigint }[]>`
			SELECT DISTINCT ld.id
			FROM legislative_document ld
			WHERE (
				to_tsvector('english', array_to_string(ld.author_names, ' ')) @@ plainto_tsquery('english', ${searchTerm})
				OR
				to_tsvector('english', array_to_string(ld.sponsor_names, ' ')) @@ plainto_tsquery('english', ${searchTerm})
			)
		`;

		return results.map((r) => r.id);
	}
}
