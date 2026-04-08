import { Injectable } from "@nestjs/common";
import {
	AppError,
	type CreateDocumentInput,
	type CreateDocumentResponse,
	type CreateDocumentUploadUrlInput,
	type CreateDocumentUploadUrlResponse,
	type CreateDocumentVersionInput,
	canRoleTransition,
	type DeleteDocumentUploadInput,
	type DeleteDocumentUploadResponse,
	DOCUMENT_TYPE_VALUES,
	type DocumentType,
	type GetDocumentListInput,
	isPurposeAllowed,
	isTransitionAllowed,
	type PublishLegislativeDocumentInput,
	type PublishLegislativeDocumentResponse,
	type PurposeType,
	type RoleType,
	SOURCE_TYPE_VALUES,
	type StatusType,
	type UpdateDocumentInput,
	type UpdateDocumentStatusInput,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import { TransactionService } from "@/app/db/transaction.service";
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";
import { Prisma } from "@/generated/prisma/client";
import type {
	ClassificationType as PrismaClassificationType,
	DocumentType as PrismaDocumentType,
	PurposeType as PrismaPurposeType,
	SourceType as PrismaSourceType,
	StatusType as PrismaStatusType,
} from "@/generated/prisma/enums";
import type {
	DocumentDetailQueryResult,
	DocumentEntity,
	DocumentListQueryResult,
} from "./types";

const DOCUMENT_BUCKET = "documents";

const TAB_TYPE_MAP: Record<
	Exclude<GetDocumentListInput["tab"], "all">,
	DocumentType[]
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
} as const;

@Injectable()
export class DocumentsService {
	constructor(
		private readonly db: DbService,
		private readonly storageService: SupabaseStorageService,
		private readonly transactionService: TransactionService,
	) {}

	async getList(input: GetDocumentListInput): Promise<DocumentListQueryResult> {
		const where = this.buildDocumentWhereClause(input);

		const orderBy: Prisma.DocumentOrderByWithRelationInput = {
			[input.sortBy]: input.sortOrder,
		};

		const skip = (input.page - 1) * input.limit;

		const [total, documents] = await Promise.all([
			this.db.document.count({ where }),
			this.db.document.findMany({
				where,
				orderBy,
				skip,
				take: input.limit,
				include: {
					invitation: {
						select: { callerSlipId: true },
						take: 1,
					},
				},
			}),
		]);

		return {
			items: documents,
			pagination: {
				total,
				page: input.page,
				limit: input.limit,
				totalPages: Math.ceil(total / input.limit),
			},
		};
	}

	async getById(id: string): Promise<DocumentDetailQueryResult> {
		const document = await this.db.document.findUnique({
			where: { id },
			include: {
				documentVersion: {
					orderBy: { versionNumber: "desc" },
				},
				documentAudit: {
					include: {
						user: {
							select: {
								fullName: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
				},
			},
		});

		if (!document) {
			throw new AppError("DOCUMENT.NOT_FOUND");
		}

		const signedUrls = new Map<string, string>();

		await Promise.all(
			document.documentVersion.map(async (version) => {
				const signed = await this.storageService.getSignedUrlOrThrow(
					DOCUMENT_BUCKET,
					version.filePath,
				);

				if (!signed.signedUrl) {
					throw new AppError("STORAGE.SIGNED_URL_FAILED");
				}

				signedUrls.set(version.filePath, signed.signedUrl);
			}),
		);

		return {
			document,
			signedUrls,
		};
	}

	async create(
		input: CreateDocumentInput,
		actorId: string,
	): Promise<CreateDocumentResponse> {
		const isInvitation = input.type === "invitation";

		if (!isInvitation && !input.classification) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"Classification is required for document intake.",
			);
		}

		const codeNumber = await this.generateCodeNumber();

		try {
			const document = await this.transactionService.run(
				"documents.create",
				async (tx) => {
					const created = await tx.document.create({
						data: {
							codeNumber,
							title: input.title,
							type: input.type as PrismaDocumentType,
							purpose: input.purpose as PrismaPurposeType,
							source: input.source as PrismaSourceType,
							status: "received",
							classification: isInvitation
								? undefined
								: (input.classification as PrismaClassificationType),
							remarks: input.remarks ?? null,
						},
					});

					await tx.documentVersion.create({
						data: {
							documentId: created.id,
							uploaderId: actorId,
							versionNumber: new Prisma.Decimal(1),
							filePath: input.filePath,
						},
					});

					await tx.documentAudit.create({
						data: {
							actorId,
							documentId: created.id,
							versionNumber: new Prisma.Decimal(1),
							filePath: input.filePath,
						},
					});

					if (
						isInvitation &&
						input.eventVenue &&
						input.eventStartTime &&
						input.eventEndTime
					) {
						await tx.invitation.create({
							data: {
								documentId: created.id,
								eventVenue: input.eventVenue,
								eventStartTime: new Date(input.eventStartTime),
								eventEndTime: new Date(input.eventEndTime),
							},
						});
					}

					return created;
				},
			);

			return {
				id: document.id,
				codeNumber: document.codeNumber,
				status: document.status,
			};
		} catch (error: unknown) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new AppError("DOCUMENT.DUPLICATE_CODE");
			}

			throw error;
		}
	}

	async updateStatus(
		input: UpdateDocumentStatusInput,
		actorId: string,
		actorRole: RoleType,
	): Promise<DocumentEntity> {
		if (input.status === "published") {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"Use the publish endpoint to archive calendared legislative documents.",
			);
		}

		const document = await this.db.document.findUnique({
			where: { id: input.id },
			include: {
				documentVersion: {
					orderBy: { versionNumber: "desc" },
					take: 1,
				},
			},
		});

		if (!document) {
			throw new AppError("DOCUMENT.NOT_FOUND");
		}

		if (
			!isTransitionAllowed(
				document.purpose as PurposeType,
				document.status as StatusType,
				input.status as StatusType,
			)
		) {
			throw new AppError("DOCUMENT.INVALID_TRANSITION");
		}

		if (
			!canRoleTransition(
				document.status as StatusType,
				input.status as StatusType,
				actorRole,
			)
		) {
			throw new AppError("GENERAL.FORBIDDEN");
		}

		const latestVersion = document.documentVersion[0];

		if (!latestVersion) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"Cannot transition a document without at least one file version.",
			);
		}

		const updated = await this.transactionService.run(
			"documents.updateStatus",
			async (tx) => {
				const updatedDocument = await tx.document.update({
					where: { id: input.id },
					data: { status: input.status as PrismaStatusType },
				});

				await tx.documentAudit.create({
					data: {
						actorId,
						documentId: updatedDocument.id,
						versionNumber: latestVersion.versionNumber,
						filePath: latestVersion.filePath,
						remarks: input.remarks ?? null,
					},
				});

				return updatedDocument;
			},
		);

		return updated;
	}

	publish(
		input: PublishLegislativeDocumentInput,
		actorId: string,
	): Promise<PublishLegislativeDocumentResponse> {
		return this.transactionService.run(
			"documents.publish",
			async (tx) => {
				const document = await tx.document.findUnique({
					where: { id: input.documentId },
					include: {
						documentVersion: {
							orderBy: { versionNumber: "desc" },
							take: 1,
						},
					},
				});

				if (!document) {
					throw new AppError("DOCUMENT.NOT_FOUND");
				}

				if (
					document.purpose !== "for_agenda" ||
					document.status !== "calendared"
				) {
					throw new AppError(
						"GENERAL.BAD_REQUEST",
						"Document must be calendared before publishing to archive.",
					);
				}

				const legislativeType = this.toLegislativeType(document.type);

				if (!legislativeType) {
					throw new AppError(
						"GENERAL.BAD_REQUEST",
						"Only proposed ordinances and proposed resolutions can be published to archive.",
					);
				}

				const latestVersion = document.documentVersion[0];

				if (!latestVersion) {
					throw new AppError(
						"GENERAL.BAD_REQUEST",
						"Document has no uploaded version to publish.",
					);
				}

				const duplicateOfficialNumber = await tx.legislativeDocument.findFirst({
					where: {
						officialNumber: input.officialNumber,
						seriesYear: new Prisma.Decimal(input.seriesYear),
						NOT: {
							documentId: input.documentId,
						},
					},
				});

				if (duplicateOfficialNumber) {
					throw new AppError(
						"GENERAL.CONFLICT",
						"A legislative document with this official number already exists.",
					);
				}

				const updateResult = await tx.document.updateMany({
					where: {
						id: input.documentId,
						purpose: "for_agenda",
						status: "calendared",
					},
					data: {
						status: "published",
						...(input.category
							? { classification: input.category as PrismaClassificationType }
							: {}),
					},
				});

				if (updateResult.count !== 1) {
					throw new AppError(
						"GENERAL.CONFLICT",
						"Document state changed. Please refresh and retry publishing.",
					);
				}

				const existingLegislativeDocument =
					await tx.legislativeDocument.findFirst({
						where: {
							documentId: input.documentId,
						},
					});

				const legislativeDocument = existingLegislativeDocument
					? await tx.legislativeDocument.update({
							where: { id: existingLegislativeDocument.id },
							data: {
								officialNumber: input.officialNumber,
								seriesYear: new Prisma.Decimal(input.seriesYear),
								type: legislativeType,
								dateEnacted: input.dateEnacted,
							},
						})
					: await tx.legislativeDocument.create({
							data: {
								documentId: input.documentId,
								officialNumber: input.officialNumber,
								seriesYear: new Prisma.Decimal(input.seriesYear),
								type: legislativeType,
								dateEnacted: input.dateEnacted,
								sponsorNames: [],
								authorNames: [],
							},
						});

				await tx.documentAudit.create({
					data: {
						actorId,
						documentId: input.documentId,
						versionNumber: latestVersion.versionNumber,
						filePath: latestVersion.filePath,
						remarks: `Published to archive as ${input.officialNumber}`,
					},
				});

				return {
					legislativeDocumentId: Number(legislativeDocument.id),
					documentId: input.documentId,
					status: "published",
				};
			},
			{
				isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
				retries: 3,
				timeout: 12_000,
				maxWait: 5_000,
			},
		);
	}

	async createVersion(
		input: CreateDocumentVersionInput,
		actorId: string,
	): Promise<DocumentDetailQueryResult> {
		await this.transactionService.run(
			"documents.createVersion",
			async (tx) => {
				const document = await tx.document.findUnique({
					where: { id: input.id },
					include: {
						documentVersion: {
							orderBy: { versionNumber: "desc" },
							take: 1,
						},
					},
				});

				if (!document) {
					throw new AppError("DOCUMENT.NOT_FOUND");
				}

				const latestVersion = document.documentVersion[0];
				const nextVersion = latestVersion
					? Number(latestVersion.versionNumber) + 1
					: 1;

				await tx.documentVersion.create({
					data: {
						documentId: input.id,
						uploaderId: actorId,
						versionNumber: new Prisma.Decimal(nextVersion),
						filePath: input.filePath,
					},
				});

				if (input.resetStatus) {
					await tx.document.update({
						where: { id: input.id },
						data: { status: "received" },
					});
				}

				await tx.documentAudit.create({
					data: {
						actorId,
						documentId: input.id,
						versionNumber: new Prisma.Decimal(nextVersion),
						filePath: input.filePath,
					},
				});
			},
			{
				isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
				retries: 3,
				timeout: 10_000,
				maxWait: 5_000,
			},
		);

		return await this.getById(input.id);
	}

	async update(
		input: UpdateDocumentInput,
		actorId: string,
	): Promise<DocumentEntity> {
		const document = await this.db.document.findUnique({
			where: { id: input.id },
			include: {
				documentVersion: {
					orderBy: { versionNumber: "desc" },
					take: 1,
				},
			},
		});

		if (!document) {
			throw new AppError("DOCUMENT.NOT_FOUND");
		}

		const nextTitle = input.title?.trim() ?? document.title;
		const nextSource = input.source ?? document.source;
		const nextRemarks =
			input.remarks !== undefined
				? input.remarks?.trim() || null
				: document.remarks;
		const nextType = input.type ?? document.type;
		const nextPurpose = input.purpose ?? document.purpose;
		const nextClassification =
			input.classification !== undefined
				? input.classification
				: document.classification;

		const lockedFieldChanged =
			nextType !== document.type ||
			nextPurpose !== document.purpose ||
			nextClassification !== document.classification;

		if (document.status !== "received" && lockedFieldChanged) {
			throw new AppError("DOCUMENT.EDIT_LOCKED");
		}

		if (nextType !== "invitation" && nextClassification === null) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"Classification is required for document records.",
			);
		}

		if (
			!isPurposeAllowed(nextType as DocumentType, nextPurpose as PurposeType)
		) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		const data: Prisma.DocumentUpdateInput = {};

		if (nextTitle !== document.title) {
			data.title = nextTitle;
		}

		if (nextSource !== document.source) {
			data.source = nextSource as PrismaSourceType;
		}

		if (nextRemarks !== document.remarks) {
			data.remarks = nextRemarks;
		}

		if (nextType !== document.type) {
			data.type = nextType as PrismaDocumentType;
		}

		if (nextPurpose !== document.purpose) {
			data.purpose = nextPurpose as PrismaPurposeType;
		}

		if (nextClassification !== document.classification) {
			data.classification =
				nextClassification === null
					? null
					: (nextClassification as PrismaClassificationType);
		}

		if (Object.keys(data).length === 0) {
			return document;
		}

		const latestVersion = document.documentVersion[0];

		if (!latestVersion) {
			throw new AppError("GENERAL.INTERNAL_SERVER_ERROR");
		}

		const changeMessages: string[] = [];

		if (nextTitle !== document.title) {
			changeMessages.push("Title updated");
		}

		if (nextSource !== document.source) {
			changeMessages.push("Source updated");
		}

		if (nextRemarks !== document.remarks) {
			changeMessages.push("Remarks updated");
		}

		if (nextType !== document.type) {
			changeMessages.push("Type updated");
		}

		if (nextPurpose !== document.purpose) {
			changeMessages.push("Purpose updated");
		}

		if (nextClassification !== document.classification) {
			changeMessages.push("Classification updated");
		}

		const updated = await this.transactionService.run(
			"documents.update",
			async (tx) => {
				const updatedDocument = await tx.document.update({
					where: { id: input.id },
					data,
				});

				await tx.documentAudit.create({
					data: {
						actorId,
						documentId: updatedDocument.id,
						versionNumber: latestVersion.versionNumber,
						filePath: latestVersion.filePath,
					},
				});

				if (nextType === "invitation") {
					const invitationData: Record<string, unknown> = {};

					if (input.eventVenue !== undefined) {
						invitationData.eventVenue = input.eventVenue;
					}
					if (input.eventStartTime !== undefined) {
						invitationData.eventStartTime = input.eventStartTime
							? new Date(input.eventStartTime)
							: undefined;
					}
					if (input.eventEndTime !== undefined) {
						invitationData.eventEndTime = input.eventEndTime
							? new Date(input.eventEndTime)
							: undefined;
					}

					if (Object.keys(invitationData).length > 0) {
						const existingInvitation = await tx.invitation.findFirst({
							where: { documentId: input.id },
						});

						if (existingInvitation) {
							await tx.invitation.update({
								where: { id: existingInvitation.id },
								data: invitationData,
							});
						} else if (
							input.eventVenue &&
							input.eventStartTime &&
							input.eventEndTime
						) {
							await tx.invitation.create({
								data: {
									documentId: input.id,
									eventVenue: input.eventVenue,
									eventStartTime: new Date(input.eventStartTime),
									eventEndTime: new Date(input.eventEndTime),
								},
							});
						}
					}
				}

				return updatedDocument;
			},
		);

		return updated;
	}

	async createUploadUrl(
		input: CreateDocumentUploadUrlInput,
	): Promise<CreateDocumentUploadUrlResponse> {
		const folder = input.documentId
			? `${DOCUMENT_BUCKET}/${input.documentId}`
			: `${DOCUMENT_BUCKET}/drafts`;
		const path = this.storageService.generateUploadPath(folder, input.fileName);

		const upload = await this.storageService.createSignedUploadUrl(
			DOCUMENT_BUCKET,
			path,
		);

		return {
			fileName: input.fileName,
			path: upload.path,
			signedUrl: upload.signedUrl,
			token: upload.token,
		};
	}

	async deleteUpload(
		input: DeleteDocumentUploadInput,
	): Promise<DeleteDocumentUploadResponse> {
		const normalizedPath = input.path.trim().replace(/^\/+/, "");

		if (input.documentId) {
			const expectedPrefix = `${DOCUMENT_BUCKET}/${input.documentId}/`;

			if (!normalizedPath.startsWith(expectedPrefix)) {
				throw new AppError(
					"GENERAL.BAD_REQUEST",
					"Invalid upload path for this document.",
				);
			}
		} else if (!normalizedPath.startsWith(`${DOCUMENT_BUCKET}/drafts/`)) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"Only draft upload paths can be cleaned without document context.",
			);
		}

		const cleanedUp = await this.storageService.deleteFile(
			DOCUMENT_BUCKET,
			normalizedPath,
		);

		return {
			cleanedUp,
		};
	}

	private buildDocumentWhereClause(
		input: GetDocumentListInput,
	): Prisma.DocumentWhereInput {
		const where: Prisma.DocumentWhereInput = {};

		const tabTypes = this.getTabTypes(input.tab);
		const selectedType = input.type
			? ([input.type] as DocumentType[])
			: undefined;
		const resolvedTypes = this.resolveTypeFilter(tabTypes, selectedType);

		if (resolvedTypes.length > 0) {
			where.type = {
				in: resolvedTypes as PrismaDocumentType[],
			};
		}

		if (input.status) {
			where.status = input.status as PrismaStatusType;
		}

		if (input.dateFrom || input.dateTo) {
			where.receivedAt = {
				...(input.dateFrom ? { gte: input.dateFrom } : {}),
				...(input.dateTo ? { lte: input.dateTo } : {}),
			};
		}

		if (input.search) {
			const search = input.search.trim();
			const matchingSources = SOURCE_TYPE_VALUES.filter((source) =>
				source.toLowerCase().includes(search.toLowerCase()),
			);

			where.OR = [
				{ codeNumber: { contains: search, mode: "insensitive" } },
				{ title: { contains: search, mode: "insensitive" } },
				...matchingSources.map((source) => ({
					source: source as PrismaSourceType,
				})),
			];
		}

		return where;
	}

	private getTabTypes(tab: GetDocumentListInput["tab"]): DocumentType[] {
		if (tab === "all") {
			return [...DOCUMENT_TYPE_VALUES];
		}

		return [...TAB_TYPE_MAP[tab]];
	}

	private resolveTypeFilter(
		tabTypes: DocumentType[],
		selectedType: DocumentType[] | undefined,
	): DocumentType[] {
		if (!selectedType || selectedType.length === 0) {
			return tabTypes;
		}

		return tabTypes.filter((type) => selectedType.includes(type));
	}

	private toLegislativeType(
		documentType: string,
	): "ordinance" | "resolution" | null {
		if (documentType === "proposed_ordinance") {
			return "ordinance";
		}

		if (documentType === "proposed_resolution") {
			return "resolution";
		}

		return null;
	}

	private async generateCodeNumber(): Promise<string> {
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

		const monthlyCount = await this.db.document.count({
			where: {
				receivedAt: {
					gte: monthStart,
					lt: nextMonthStart,
				},
			},
		});

		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const sequence = String(monthlyCount + 1).padStart(4, "0");

		return `DOC-${year}-${month}-${sequence}`;
	}
}
