import { Injectable, Logger } from "@nestjs/common";
import {
	AppError,
	type CreateDocumentInput,
	type CreateDocumentResponse,
	type CreateDocumentUploadUrlInput,
	type CreateDocumentUploadUrlResponse,
	type CreateDocumentVersionInput,
	canRoleTransition,
	type DeleteDocumentInput,
	type DeleteDocumentResponse,
	type DeleteDocumentUploadInput,
	type DeleteDocumentUploadResponse,
	DOCUMENT_TYPE_VALUES,
	type DocumentIDType,
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
import { ConfigService } from "@/lib/config.service";
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

const HARD_DELETE_ALLOWED_STATUSES: StatusType[] = ["received", "returned"];
const HEAD_ADMIN_DELETE_ALLOWED_STATUS: StatusType = "for_initial";

@Injectable()
export class DocumentsService {
	private readonly logger = new Logger(DocumentsService.name);

	constructor(
		private readonly db: DbService,
		private readonly storageService: SupabaseStorageService,
		private readonly transactionService: TransactionService,
		private readonly configService: ConfigService,
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
				invitation: {
					select: {
						callerSlipId: true,
						vmDecision: true,
						vmDecisionRemarks: true,
						representativeName: true,
					},
					take: 1,
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
								? null
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
				invitation: {
					select: {
						callerSlipId: true,
					},
					take: 1,
				},
				legislativeDocument: {
					select: {
						id: true,
					},
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

				if (document.status === "published" && input.status === "received") {
					await tx.legislativeDocument.deleteMany({
						where: {
							documentId: input.id,
						},
					});
				}

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
					(document.status !== "calendared" && document.status !== "published")
				) {
					throw new AppError(
						"GENERAL.BAD_REQUEST",
						"Document must be calendared or already published to manage archive details.",
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

				const statusBeforeArchiveOperation = document.status;

				const updateResult = await tx.document.updateMany({
					where: {
						id: input.documentId,
						purpose: "for_agenda",
						status: statusBeforeArchiveOperation,
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

				const legislativeDocumentId = Number(legislativeDocument.id);
				const portalBaseUrl = this.configService
					.getOrThrow("portalUrl")
					.replace(/\/+$/, "");
				const publishedDocumentUrl = `${portalBaseUrl}/legislative-documents/${legislativeDocumentId}`;

				await tx.documentAudit.create({
					data: {
						actorId,
						documentId: input.documentId,
						versionNumber: latestVersion.versionNumber,
						filePath: latestVersion.filePath,
						remarks:
							statusBeforeArchiveOperation === "published"
								? `Updated archive details at ${publishedDocumentUrl}`
								: `Published to archive as ${publishedDocumentUrl}`,
					},
				});

				return {
					legislativeDocumentId,
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
						remarks: input.resetStatus
							? "SYSTEM:VERSION_UPLOAD_RESET_STATUS_RECEIVED"
							: null,
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
				invitation: {
					select: {
						callerSlipId: true,
					},
					take: 1,
				},
				legislativeDocument: {
					select: {
						id: true,
					},
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
		const isConvertingToInvitation =
			document.type !== "invitation" && nextType === "invitation";
		const isConvertingFromInvitation =
			document.type === "invitation" && nextType !== "invitation";
		const hasAssignedCallerSlip = document.invitation.some(
			(invitation) => invitation.callerSlipId !== null,
		);
		const hasPublishedLegislativeRecord =
			document.legislativeDocument.length > 0;
		const attemptedInvitationDetailChange =
			input.eventVenue !== undefined ||
			input.eventStartTime !== undefined ||
			input.eventEndTime !== undefined;

		const lockedFieldChanged =
			nextType !== document.type ||
			nextPurpose !== document.purpose ||
			nextClassification !== document.classification;

		const callerSlipProtectedFieldChanged =
			nextTitle !== document.title ||
			nextSource !== document.source ||
			nextType !== document.type ||
			nextPurpose !== document.purpose ||
			nextClassification !== document.classification ||
			attemptedInvitationDetailChange;

		if (hasAssignedCallerSlip && callerSlipProtectedFieldChanged) {
			throw new AppError(
				"DOCUMENT.EDIT_LOCKED",
				"This invitation is already assigned to a Caller's Slip. Only remarks can be updated.",
			);
		}

		if (hasPublishedLegislativeRecord && nextType !== document.type) {
			throw new AppError(
				"DOCUMENT.EDIT_LOCKED",
				"Published legislative documents cannot change type.",
			);
		}

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

		if (isConvertingToInvitation) {
			const eventVenue = input.eventVenue?.trim() ?? "";
			const eventStartTime = input.eventStartTime;
			const eventEndTime = input.eventEndTime;

			if (!eventVenue || !eventStartTime || !eventEndTime) {
				throw new AppError(
					"GENERAL.BAD_REQUEST",
					"Event venue, date, and time are required when converting to invitation.",
				);
			}

			const parsedStart = new Date(eventStartTime);
			const parsedEnd = new Date(eventEndTime);

			if (
				Number.isNaN(parsedStart.getTime()) ||
				Number.isNaN(parsedEnd.getTime())
			) {
				throw new AppError(
					"GENERAL.BAD_REQUEST",
					"Invalid invitation event date/time.",
				);
			}
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

				if (isConvertingFromInvitation) {
					await tx.invitation.deleteMany({
						where: { documentId: input.id },
					});
				} else if (nextType === "invitation") {
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

	async deleteDocument(
		input: DeleteDocumentInput,
		actorId: string,
		actorRole: RoleType,
	): Promise<DeleteDocumentResponse> {
		const result = await this.transactionService.run(
			"documents.delete",
			async (tx) => {
				const document = await tx.document.findUnique({
					where: { id: input.id },
					include: {
						documentVersion: {
							select: {
								filePath: true,
							},
						},
						documentAudit: {
							select: {
								filePath: true,
							},
						},
						sessionAgendaItem: {
							select: {
								id: true,
							},
							take: 1,
						},
						invitation: {
							select: {
								callerSlipId: true,
								callerSlip: {
									select: {
										status: true,
									},
								},
							},
						},
					},
				});

				if (!document) {
					throw new AppError("DOCUMENT.NOT_FOUND");
				}

				if (document.status === "published" || document.status === "released") {
					throw new AppError("DOCUMENT.DELETE_TERMINAL_STATUS");
				}

				const isHeadAdmin = actorRole === "head_admin";
				const isAllowedStatus =
					HARD_DELETE_ALLOWED_STATUSES.includes(
						document.status as StatusType,
					) ||
					(isHeadAdmin && document.status === HEAD_ADMIN_DELETE_ALLOWED_STATUS);

				if (!isAllowedStatus) {
					throw new AppError(
						"GENERAL.FORBIDDEN",
						"Only received or returned documents can be deleted. Head admins may also delete for-initial documents.",
					);
				}

				if (document.sessionAgendaItem.length > 0) {
					throw new AppError("DOCUMENT.LINKED_TO_SESSION_AGENDA");
				}

				const hasCompletedSlip = document.invitation.some(
					(invitation) => invitation.callerSlip?.status === "completed",
				);

				if (hasCompletedSlip) {
					throw new AppError("DOCUMENT.INVITATION_ON_COMPLETED_SLIP");
				}

				const storagePaths = new Set<string>();
				for (const version of document.documentVersion) {
					storagePaths.add(version.filePath);
				}

				for (const audit of document.documentAudit) {
					storagePaths.add(audit.filePath);
				}

				const callerSlipIds = new Set<string>();
				for (const invitation of document.invitation) {
					if (invitation.callerSlipId) {
						callerSlipIds.add(invitation.callerSlipId);
					}
				}

				await tx.invitation.deleteMany({
					where: {
						documentId: input.id,
					},
				});

				await tx.documentAudit.deleteMany({
					where: {
						documentId: input.id,
					},
				});

				await tx.documentVersion.deleteMany({
					where: {
						documentId: input.id,
					},
				});

				await tx.legislativeDocument.deleteMany({
					where: {
						documentId: input.id,
					},
				});

				await tx.document.delete({
					where: {
						id: input.id,
					},
				});

				for (const callerSlipId of callerSlipIds) {
					const remainingInvitations = await tx.invitation.count({
						where: {
							callerSlipId,
						},
					});

					if (remainingInvitations === 0) {
						await tx.callerSlip.delete({
							where: {
								id: callerSlipId,
							},
						});
					}
				}

				return {
					codeNumber: document.codeNumber,
					storagePaths: [...storagePaths],
				};
			},
			{
				isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
				retries: 3,
				timeout: 12_000,
				maxWait: 5_000,
			},
		);

		await Promise.all(
			result.storagePaths.map(async (path) => {
				const cleanedUp = await this.storageService.deleteFile(
					DOCUMENT_BUCKET,
					path,
				);

				if (!cleanedUp) {
					this.logger.warn(
						`Document ${input.id} deleted but storage cleanup failed for path=${path}`,
					);
				}
			}),
		);

		this.logger.log(
			`Document ${result.codeNumber} deleted by actorId=${actorId}`,
		);

		return { success: true };
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

	// DN YR-MO-XXXX (xxxx as order number)
	private async generateCodeNumber(): Promise<DocumentIDType> {
		const now = new Date();
		// first day of the month at 00:00:00
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		// first day of the next month at 00:00:00
		const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

		// how many documents have been received this month?
		const monthlyCount = await this.db.document.count({
			where: {
				receivedAt: {
					gte: monthStart,
					lt: nextMonthStart,
				},
			},
		});

		const year = now.getFullYear().toString().slice(-2); // last two digits of the year
		const month = String(now.getMonth() + 1).padStart(2, "0"); // month as two digits
		const sequence = String(monthlyCount + 1).padStart(4, "0"); // sequence number padded to 4 digits

		return `DN ${year}-${month}-${sequence}`;
	}
}
