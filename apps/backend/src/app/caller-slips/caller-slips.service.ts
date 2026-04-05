import { Injectable, Logger } from "@nestjs/common";
import {
	AppError,
	type CallerSlipDetail,
	type CallerSlipListResponse,
	type CompleteCallerSlipResponse,
	type GenerateCallerSlipInput,
	type GenerateCallerSlipResponse,
	type GetCallerSlipListInput,
	type RecordDecisionInput,
	type RecordDecisionResponse,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import type { DecisionType as PrismaDecisionType } from "@/generated/prisma/enums";

@Injectable()
export class CallerSlipsService {
	private readonly logger = new Logger(CallerSlipsService.name);

	constructor(private readonly db: DbService) {}

	async getList(
		input: GetCallerSlipListInput,
	): Promise<CallerSlipListResponse> {
		const { status, search, dateFrom, dateTo, page, limit } = input;
		const offset = (page - 1) * limit;

		const where: Record<string, unknown> = {};

		if (status) {
			where.status = status;
		}

		if (search) {
			where.name = { contains: search, mode: "insensitive" };
		}

		if (dateFrom || dateTo) {
			const createdAtFilter: Record<string, Date> = {};
			if (dateFrom) {
				createdAtFilter.gte = new Date(`${dateFrom}T00:00:00`);
			}
			if (dateTo) {
				createdAtFilter.lte = new Date(`${dateTo}T23:59:59.999`);
			}
			where.createdAt = createdAtFilter;
		}

		const [items, total] = await Promise.all([
			this.db.callerSlip.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: offset,
				take: limit,
				include: {
					user: { select: { id: true, fullName: true } },
					_count: { select: { invitation: true } },
				},
			}),
			this.db.callerSlip.count({ where }),
		]);

		return {
			items: items.map((slip) => ({
				id: slip.id,
				name: slip.name,
				status: slip.status,
				createdAt: slip.createdAt.toISOString(),
				invitationCount: slip._count.invitation,
				generatedBy: {
					id: slip.user.id,
					fullName: slip.user.fullName,
				},
			})),
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getById(id: string): Promise<CallerSlipDetail> {
		const slip = await this.db.callerSlip.findUnique({
			where: { id },
			include: {
				user: { select: { id: true, fullName: true } },
				invitation: {
					include: {
						document: {
							select: {
								codeNumber: true,
								title: true,
								receivedAt: true,
								source: true,
							},
						},
					},
					orderBy: { eventStartTime: "asc" },
				},
			},
		});

		if (!slip) {
			throw new AppError("CALLER_SLIP.NOT_FOUND");
		}

		return {
			id: slip.id,
			name: slip.name,
			status: slip.status,
			createdAt: slip.createdAt.toISOString(),
			generatedBy: {
				id: slip.user.id,
				fullName: slip.user.fullName,
			},
			invitations: slip.invitation.map((inv) => ({
				id: inv.id,
				documentId: inv.documentId,
				document: {
					codeNumber: inv.document.codeNumber,
					title: inv.document.title,
					receivedAt: inv.document.receivedAt.toISOString(),
					source: inv.document.source,
				},
				eventVenue: inv.eventVenue,
				eventStartTime: inv.eventStartTime.toISOString(),
				eventEndTime: inv.eventEndTime.toISOString(),
				vmDecision: inv.vmDecision,
				vmDecisionRemarks: inv.vmDecisionRemarks,
				representativeName: inv.representativeName,
			})),
		};
	}

	async generate(
		input: GenerateCallerSlipInput,
		userId: string,
	): Promise<GenerateCallerSlipResponse> {
		const { name, invitationDocumentIds } = input;

		if (invitationDocumentIds.length === 0) {
			throw new AppError("CALLER_SLIP.EMPTY_BATCH");
		}

		// Verify all documents exist, are invitation type, and are not yet assigned to a caller slip
		const documents = await this.db.document.findMany({
			where: {
				id: { in: invitationDocumentIds },
			},
			include: {
				invitation: {
					select: { id: true, callerSlipId: true },
				},
			},
		});

		if (documents.length !== invitationDocumentIds.length) {
			throw new AppError(
				"GENERAL.NOT_FOUND",
				"One or more documents not found",
			);
		}

		for (const doc of documents) {
			if (doc.type !== "invitation") {
				throw new AppError(
					"CALLER_SLIP.INVITATION_NOT_INVITATION_TYPE",
					`Document ${doc.codeNumber} is not an invitation`,
				);
			}

			// Check if this document already has an invitation assigned to a caller slip
			const assignedInvitation = doc.invitation.find(
				(inv) => inv.callerSlipId !== null,
			);
			if (assignedInvitation) {
				throw new AppError(
					"CALLER_SLIP.INVITATION_ALREADY_ASSIGNED",
					`Document ${doc.codeNumber} is already assigned to a caller slip`,
				);
			}
		}

		// Create caller slip and link existing invitations (or create new ones) in a transaction
		const slip = await this.db.$transaction(async (tx) => {
			const newSlip = await tx.callerSlip.create({
				data: {
					name,
					status: "pending",
					generatedBy: userId,
				},
			});

			// For each document, find its existing invitation and link it to the slip,
			// or create a new invitation if none exists
			for (const doc of documents) {
				const existingInvitation = doc.invitation[0];
				if (existingInvitation) {
					// Link existing invitation to the caller slip
					await tx.invitation.update({
						where: { id: existingInvitation.id },
						data: { callerSlipId: newSlip.id },
					});
				}
			}

			return newSlip;
		});

		this.logger.log(
			`Caller slip "${slip.name}" generated with ${invitationDocumentIds.length} invitations by user ${userId}`,
		);

		return {
			id: slip.id,
			name: slip.name,
			status: slip.status,
		};
	}

	async recordDecision(
		input: RecordDecisionInput,
	): Promise<RecordDecisionResponse> {
		const {
			slipId,
			invitationId,
			vmDecision,
			vmDecisionRemarks,
			representativeName,
		} = input;

		// Verify the caller slip exists and is not completed
		const slip = await this.db.callerSlip.findUnique({
			where: { id: slipId },
		});

		if (!slip) {
			throw new AppError("CALLER_SLIP.NOT_FOUND");
		}

		if (slip.status === "completed") {
			throw new AppError("CALLER_SLIP.ALREADY_COMPLETED");
		}

		// Verify the invitation belongs to this caller slip
		const invitation = await this.db.invitation.findUnique({
			where: { id: invitationId },
			include: {
				document: {
					select: {
						codeNumber: true,
						title: true,
						receivedAt: true,
						source: true,
					},
				},
			},
		});

		if (!invitation || invitation.callerSlipId !== slipId) {
			throw new AppError(
				"CALLER_SLIP.NOT_FOUND",
				"Invitation not found in this caller slip",
			);
		}

		// Update the decision
		const updated = await this.db.invitation.update({
			where: { id: invitationId },
			data: {
				vmDecision: vmDecision as PrismaDecisionType,
				vmDecisionRemarks: vmDecisionRemarks ?? null,
				representativeName:
					vmDecision === "assign_representative"
						? (representativeName ?? null)
						: null,
			},
			include: {
				document: {
					select: {
						codeNumber: true,
						title: true,
						receivedAt: true,
						source: true,
					},
				},
			},
		});

		this.logger.log(
			`Decision "${vmDecision}" recorded for invitation ${invitationId} on slip ${slipId}`,
		);

		const doc = updated.document as {
			codeNumber: string;
			title: string;
			receivedAt: Date;
			source: string;
		};

		return {
			id: updated.id,
			documentId: updated.documentId,
			document: {
				codeNumber: doc.codeNumber,
				title: doc.title,
				receivedAt: doc.receivedAt.toISOString(),
				source: doc.source,
			},
			eventVenue: updated.eventVenue,
			eventStartTime: updated.eventStartTime.toISOString(),
			eventEndTime: updated.eventEndTime.toISOString(),
			vmDecision: updated.vmDecision,
			vmDecisionRemarks: updated.vmDecisionRemarks,
			representativeName: updated.representativeName,
		};
	}

	async complete(id: string): Promise<CompleteCallerSlipResponse> {
		const slip = await this.db.callerSlip.findUnique({
			where: { id },
		});

		if (!slip) {
			throw new AppError("CALLER_SLIP.NOT_FOUND");
		}

		if (slip.status === "completed") {
			throw new AppError("CALLER_SLIP.ALREADY_COMPLETED");
		}

		const updated = await this.db.callerSlip.update({
			where: { id },
			data: { status: "completed" },
		});

		this.logger.log(`Caller slip "${updated.name}" marked as completed`);

		return {
			id: updated.id,
			name: updated.name,
			status: updated.status,
		};
	}
}
