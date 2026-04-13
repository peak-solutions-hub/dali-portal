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
	toLegislativeDocumentResponse,
	toPaginationInfo,
} from "@/app/legislative-documents/dtos";
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";
import { Prisma } from "@/generated/prisma/client";
import type { ClassificationType as PrismaClassificationType } from "@/generated/prisma/enums";

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

const DOCUMENTS_BUCKET = "documents";

@Injectable()
export class LegislativeDocumentsService {
	constructor(
		private readonly db: DbService,
		private readonly storage: SupabaseStorageService,
	) {}

	private toResponse(
		doc: LegislativeDocumentWithRelations,
	): LegislativeDocumentWithDetails {
		return toLegislativeDocumentResponse(doc);
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
		const enrichedDocs = await this.enrichWithPdfUrls(transformedDocs);

		return {
			documents: enrichedDocs,
			pagination: toPaginationInfo({
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

		const response = this.toResponse(document);
		return this.enrichWithPdfUrl(response);
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
			orderBy: { dateEnacted: "desc" },
			take: limit,
		});

		const transformedDocs = documents.map((doc) => this.toResponse(doc));
		const enrichedDocs = await this.enrichWithPdfUrls(transformedDocs);

		return {
			documents: enrichedDocs,
			pagination: toPaginationInfo({
				page: 1,
				limit,
				totalItems: enrichedDocs.length,
			}),
		};
	}

	private async enrichWithPdfUrl(
		doc: LegislativeDocumentWithDetails,
	): Promise<LegislativeDocumentWithDetails> {
		if (!doc.storagePath) return doc;

		const result = await this.storage.getSignedUrl(
			DOCUMENTS_BUCKET,
			doc.storagePath,
		);

		return result.signedUrl ? { ...doc, pdfUrl: result.signedUrl } : doc;
	}

	private async enrichWithPdfUrls(
		docs: LegislativeDocumentWithDetails[],
	): Promise<LegislativeDocumentWithDetails[]> {
		const pathMap = new Map<string, number[]>();
		for (let i = 0; i < docs.length; i++) {
			const path = docs[i].storagePath;
			if (path) {
				if (!pathMap.has(path)) pathMap.set(path, []);
				pathMap.get(path)!.push(i);
			}
		}

		if (pathMap.size === 0) return docs;

		const paths = [...pathMap.keys()];
		const results = await this.storage.getSignedUrls(DOCUMENTS_BUCKET, paths);

		const enriched = [...docs];
		for (const result of results) {
			if (result.signedUrl) {
				const indices = pathMap.get(result.path);
				if (indices) {
					for (const idx of indices) {
						enriched[idx] = { ...enriched[idx], pdfUrl: result.signedUrl };
					}
				}
			}
		}

		return enriched;
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
				classification: classification as PrismaClassificationType,
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
		const trimmed = searchTerm.trim();

		// Validate and sanitize search input
		if (!trimmed) return [];

		// Remove potentially problematic characters for full-text search
		const sanitized = trimmed.replace(/[<>{}[\]\\]/g, "");

		if (!sanitized) return [];

		const results = await this.db.$queryRaw<{ id: bigint }[]>`
			SELECT DISTINCT ld.id
			FROM legislative_document ld
			LEFT JOIN document d ON ld.document_id = d.id
			WHERE (
				to_tsvector('english', array_to_string(ld.author_names, ' ')) @@ plainto_tsquery('english', ${sanitized})
				OR
				to_tsvector('english', array_to_string(ld.sponsor_names, ' ')) @@ plainto_tsquery('english', ${sanitized})
				OR
				to_tsvector('english', COALESCE(d.classification::text, '')) @@ plainto_tsquery('english', ${sanitized})
				OR
				to_tsvector('english', COALESCE(ld.series_year::text, '')) @@ plainto_tsquery('english', ${sanitized})
				OR
				to_tsvector('english', COALESCE(ld.type, '')) @@ plainto_tsquery('english', ${sanitized})
			)
		`;

		return results.map((r) => r.id);
	}
}
