import { Injectable } from "@nestjs/common";
import {
	AppError,
	type CreateDocumentInput,
	type CreateDocumentResponse,
	type CreateDocumentUploadUrlInput,
	type CreateDocumentUploadUrlResponse,
	type CreateDocumentVersionInput,
	DOCUMENT_TYPE_VALUES,
	type DocumentDetail,
	type DocumentListResponse,
	type DocumentResponse,
	type DocumentType,
	type GetDocumentListInput,
	isPurposeAllowed,
	isTransitionAllowed,
	type PurposeType,
	type RoleType,
	SOURCE_TYPE_VALUES,
	type StatusType,
	type UpdateDocumentInput,
	type UpdateDocumentStatusInput,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";
import { Prisma } from "@/generated/prisma/client";
import type {
	ClassificationType as PrismaClassificationType,
	DocumentType as PrismaDocumentType,
	PurposeType as PrismaPurposeType,
	SourceType as PrismaSourceType,
	StatusType as PrismaStatusType,
} from "@/generated/prisma/enums";

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

const TRANSITION_ROLE_MAP: Record<string, RoleType[]> = {
	"received->for_initial": ["admin_staff", "head_admin", "vice_mayor"],
	"for_initial->for_signature": ["head_admin", "vice_mayor"],
	"for_signature->approved": ["vice_mayor"],
	"approved->released": ["admin_staff", "head_admin"],
	"approved->calendared": ["legislative_staff", "head_admin"],
	"calendared->published": ["legislative_staff", "head_admin"],
	"returned->received": ["admin_staff", "head_admin", "vice_mayor"],
};

@Injectable()
export class DocumentsService {
	constructor(
		private readonly db: DbService,
		private readonly storageService: SupabaseStorageService,
	) {}

	async getList(input: GetDocumentListInput): Promise<DocumentListResponse> {
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
			items: documents.map((document) => ({
				...this.toDocumentResponse(document),
				callerSlipId: document.invitation[0]?.callerSlipId ?? null,
			})),
			pagination: {
				total,
				page: input.page,
				limit: input.limit,
				totalPages: Math.ceil(total / input.limit),
			},
		};
	}

	async getById(id: string): Promise<DocumentDetail> {
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

		const versions = await Promise.all(
			document.documentVersion.map(async (version) => {
				const signed = await this.storageService.getSignedUrlOrThrow(
					DOCUMENT_BUCKET,
					version.filePath,
				);

				if (!signed.signedUrl) {
					throw new AppError("STORAGE.SIGNED_URL_FAILED");
				}

				return {
					id: version.id,
					documentId: version.documentId,
					uploaderId: version.uploaderId,
					versionNumber: Number(version.versionNumber),
					filePath: version.filePath,
					signedUrl: signed.signedUrl,
					createdAt: version.createdAt.toISOString(),
				};
			}),
		);

		const baseAuditTrail = document.documentAudit.map((audit) => ({
			id: audit.id,
			actorId: audit.actorId,
			actorName: audit.user.fullName,
			documentId: audit.documentId,
			versionNumber: Number(audit.versionNumber),
			filePath: audit.filePath,
			remarks: audit.remarks ?? null,
			createdAt: audit.createdAt.toISOString(),
		}));

		const auditTrail = this.enrichAuditTrail(
			baseAuditTrail,
			document.status as StatusType,
			document.purpose as PurposeType,
		);

		return {
			...this.toDocumentResponse(document),
			versions,
			auditTrail,
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
			const document = await this.db.$transaction(async (tx) => {
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

				// Create invitation record for invitation-type documents
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
			});

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
	): Promise<DocumentResponse> {
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

		this.assertRoleCanTransition(
			document.status as StatusType,
			input.status as StatusType,
			actorRole,
		);

		const latestVersion = document.documentVersion[0];

		const updated = await this.db.$transaction(async (tx) => {
			const updatedDocument = await tx.document.update({
				where: { id: input.id },
				data: { status: input.status as PrismaStatusType },
			});

			await tx.documentAudit.create({
				data: {
					actorId,
					documentId: updatedDocument.id,
					versionNumber: latestVersion?.versionNumber ?? new Prisma.Decimal(0),
					filePath: latestVersion?.filePath ?? "",
					remarks: input.remarks ?? null,
				},
			});

			return updatedDocument;
		});

		return this.toDocumentResponse(updated);
	}

	async createVersion(
		input: CreateDocumentVersionInput,
		actorId: string,
	): Promise<DocumentDetail> {
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

		const latestVersion = document.documentVersion[0];
		const nextVersion = latestVersion
			? Number(latestVersion.versionNumber) + 1
			: 1;

		await this.db.$transaction(async (tx) => {
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
		});

		return await this.getById(input.id);
	}

	async update(
		input: UpdateDocumentInput,
		actorId: string,
	): Promise<DocumentResponse> {
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
			return this.toDocumentResponse(document);
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

		const updated = await this.db.$transaction(async (tx) => {
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

			// Upsert invitation record when document is invitation type
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
		});

		return this.toDocumentResponse(updated);
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

	private toDocumentResponse(
		document: Pick<
			Prisma.DocumentGetPayload<object>,
			| "id"
			| "codeNumber"
			| "title"
			| "type"
			| "purpose"
			| "source"
			| "status"
			| "classification"
			| "remarks"
			| "receivedAt"
		>,
	): DocumentResponse {
		return {
			id: document.id,
			codeNumber: document.codeNumber,
			title: document.title,
			type: document.type,
			purpose: document.purpose,
			source: document.source,
			status: document.status,
			classification: document.classification,
			remarks: document.remarks,
			receivedAt: document.receivedAt.toISOString(),
		};
	}

	private assertRoleCanTransition(
		currentStatus: StatusType,
		nextStatus: StatusType,
		role: RoleType,
	): void {
		if (nextStatus === "returned") {
			if (role === "head_admin" || role === "vice_mayor") {
				return;
			}
			throw new AppError("GENERAL.FORBIDDEN");
		}

		const key = `${currentStatus}->${nextStatus}`;
		const allowedRoles = TRANSITION_ROLE_MAP[key];

		if (!allowedRoles) {
			return;
		}

		if (!allowedRoles.includes(role)) {
			throw new AppError("GENERAL.FORBIDDEN");
		}
	}

	private enrichAuditTrail(
		audits: Array<{
			id: string;
			actorId: string;
			actorName: string;
			documentId: string;
			versionNumber: number;
			filePath: string;
			remarks: string | null;
			createdAt: string;
		}>,
		currentStatus: StatusType,
		currentPurpose: PurposeType,
	): Array<{
		id: string;
		actorId: string;
		actorName: string;
		documentId: string;
		versionNumber: number;
		filePath: string;
		remarks: string | null;
		createdAt: string;
		action: string;
	}> {
		return audits.map((audit, index) => {
			const nextOlderAudit = audits[index + 1];
			const isOldestAudit = index === audits.length - 1;
			const isLatestAudit = index === 0;
			const versionIncreased =
				nextOlderAudit !== undefined &&
				audit.versionNumber > nextOlderAudit.versionNumber;

			let action = "Document details updated";

			if (isOldestAudit) {
				action = "Document received";
			} else if (versionIncreased) {
				action = `Version ${audit.versionNumber} uploaded`;

				if (isLatestAudit && currentStatus === "received") {
					action = `${action}. Status reset to Received`;
				}
			} else if (isLatestAudit) {
				if (currentStatus === "published" && currentPurpose === "for_agenda") {
					action = "Published to archive";
				} else if (currentStatus !== "received") {
					action = `Status changed to ${this.formatStatusLabel(currentStatus)}`;
				}
			}

			return {
				...audit,
				action,
			};
		});
	}

	private formatStatusLabel(status: StatusType): string {
		return status
			.split("_")
			.map((token) => token.charAt(0).toUpperCase() + token.slice(1))
			.join(" ");
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
