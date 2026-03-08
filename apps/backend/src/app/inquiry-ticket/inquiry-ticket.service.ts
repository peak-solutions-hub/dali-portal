import { Injectable, Logger } from "@nestjs/common";
import {
	AppError,
	type CreateInquiryTicketInput,
	type CreateInquiryTicketResponse,
	type CreateSignedUploadUrlsInput,
	formatCitizenFullName,
	type GetInquiryTicketByIdInput,
	type GetInquiryTicketListInput,
	INQUIRY_ASSIGNABLE_ROLES,
	INQUIRY_ASSIGNERS,
	INQUIRY_CATEGORY_LABELS,
	type InquiryMessage,
	type InquiryMessageWithAttachments,
	type InquiryStatusCounts,
	type InquiryTicket,
	type InquiryTicketListResponse,
	type InquiryTicketResponse,
	type InquiryTicketWithMessagesAndAttachments,
	type RoleType,
	type TrackInquiryTicketInput,
	type TrackInquiryTicketResponse,
	type UpdateInquiryTicketStatusInput,
} from "@repo/shared";
import { customAlphabet } from "nanoid";
import { DbService } from "@/app/db/db.service";
import { SupabaseStorageService } from "@/app/util/supabase/supabase-storage.service";
import { ConfigService } from "@/lib/config.service";
import { ResendService } from "@/lib/resend.service";

/** Storage bucket for inquiry attachments */
const ATTACHMENTS_BUCKET = "attachments";

@Injectable()
export class InquiryTicketService {
	private readonly logger = new Logger(InquiryTicketService.name);

	private isAssigner(role?: RoleType): boolean {
		return role != null && INQUIRY_ASSIGNERS.includes(role);
	}

	private isAssignee(role?: RoleType): boolean {
		return role != null && INQUIRY_ASSIGNABLE_ROLES.includes(role);
	}

	constructor(
		private readonly db: DbService,
		private readonly resend: ResendService,
		private readonly storageService: SupabaseStorageService,
		private readonly config: ConfigService,
	) {}

	async create(
		input: CreateInquiryTicketInput,
	): Promise<CreateInquiryTicketResponse> {
		const currentYear = new Date().getFullYear();

		const referenceNumber = this.generateReferenceNumber(currentYear);

		// Compose full name for compat column, email, and message senderName
		const fullName = formatCitizenFullName({
			citizenFirstName: input.citizenFirstName,
			citizenLastName: input.citizenLastName,
		});

		// create inquiry ticket
		const response = await this.db.inquiryTicket.create({
			data: {
				referenceNumber,
				citizenEmail: input.citizenEmail || null,
				citizenFirstName: input.citizenFirstName,
				citizenLastName: input.citizenLastName,
				citizenContactNumber: input.citizenContactNumber || null,
				citizenAddress: input.citizenAddress || null,
				category: input.category,
				subject: input.subject,
				status: "new",
				// create initial inquiry message with optional attachments
				// https://www.prisma.io/docs/orm/prisma-client/queries/transactions#nested-writes-1
				inquiryMessages: {
					create: [
						{
							senderName: fullName,
							content: input.message,
							senderType: "citizen",
							attachmentPaths: input.attachmentPaths ?? [],
						},
					],
				},
			},
		});

		// send confirmation email only if citizen provided an email address
		if (response.citizenEmail) {
			const portalUrl = `${this.config.getOrThrow("portalUrl")}/inquiries?ref=${encodeURIComponent(response.referenceNumber)}`;

			const emailRes = await this.resend.send({
				to: response.citizenEmail,
				template: {
					id: "inquiry-confirmation",
					variables: {
						CITIZEN_NAME: fullName,
						REFERENCE_NUMBER: response.referenceNumber,
						SUBJECT: response.subject,
						CATEGORY: INQUIRY_CATEGORY_LABELS[response.category],
						YEAR: new Date().getFullYear().toString(),
						PORTAL_URL: portalUrl,
					},
				},
			});

			if (emailRes.error) {
				// override error message to be more user-friendly
				throw new AppError("INQUIRY.EMAIL_SEND_FAILED", emailRes.error.message);
			}
		}

		return { referenceNumber };
	}

	async track(
		input: TrackInquiryTicketInput,
	): Promise<TrackInquiryTicketResponse | null> {
		// fetch inquiry ticket by reference number and citizen contact number
		const ticketId = await this.db.inquiryTicket.findFirst({
			where: {
				referenceNumber: input.referenceNumber,
				citizenContactNumber: input.citizenContactNumber,
			},
			select: { id: true },
		});

		return ticketId;
	}

	/**
	 * Get inquiry ticket with all messages and pre-signed attachment URLs.
	 * Signed URLs are valid for 1 hour and generated server-side.
	 */
	async getWithMessages(
		input: GetInquiryTicketByIdInput,
	): Promise<InquiryTicketWithMessagesAndAttachments> {
		const inquiryTicketWithMessages =
			await this.db.inquiryTicket.findFirstOrThrow({
				where: { id: input.id },
				include: {
					inquiryMessages: {
						orderBy: { createdAt: "asc" },
					},
					user: {
						select: {
							id: true,
							fullName: true,
						},
					},
				},
			});

		if (!inquiryTicketWithMessages) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		// Generate signed URLs for all message attachments
		const messagesWithAttachments = await Promise.all(
			inquiryTicketWithMessages.inquiryMessages.map(async (message) =>
				this.addAttachmentUrlsToMessage(message),
			),
		);

		return {
			...inquiryTicketWithMessages,
			inquiryMessages: messagesWithAttachments,
		};
	}

	async getById(
		input: GetInquiryTicketByIdInput,
	): Promise<InquiryTicketResponse> {
		const inquiryTicket = await this.db.inquiryTicket.findFirst({
			where: { id: input.id },
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		if (!inquiryTicket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		return {
			...inquiryTicket,
			createdAt: inquiryTicket.createdAt.toISOString(),
		};
	}

	async getList(
		input: GetInquiryTicketListInput,
	): Promise<InquiryTicketListResponse> {
		const { status, category, limit, page } = input;

		const skip = (page - 1) * limit;

		// Build where clause
		const where = {
			...(status && { status }),
			...(category && { category }),
		};

		// Get total count for pagination
		const totalItems = await this.db.inquiryTicket.count({ where });

		// Get paginated results
		const inquiryTickets = await this.db.inquiryTicket.findMany({
			where,
			take: limit,
			skip,
			orderBy: { createdAt: "desc" },
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		// Calculate pagination info
		const totalPages = Math.ceil(totalItems / limit);
		const hasNextPage = page < totalPages;
		const hasPreviousPage = page > 1;

		return {
			tickets: inquiryTickets.map((ticket) => ({
				...ticket,
				createdAt: ticket.createdAt.toISOString(),
			})),
			pagination: {
				currentPage: page,
				totalPages,
				totalItems,
				itemsPerPage: limit,
				hasNextPage,
				hasPreviousPage,
			},
		};
	}

	async getStatusCounts(): Promise<InquiryStatusCounts> {
		// Get all counts in parallel for maximum efficiency
		const [all, newCount, open, waiting, resolved, rejected] =
			await Promise.all([
				this.db.inquiryTicket.count(),
				this.db.inquiryTicket.count({ where: { status: "new" } }),
				this.db.inquiryTicket.count({ where: { status: "open" } }),
				this.db.inquiryTicket.count({
					where: { status: "waiting_for_citizen" },
				}),
				this.db.inquiryTicket.count({ where: { status: "resolved" } }),
				this.db.inquiryTicket.count({ where: { status: "rejected" } }),
			]);

		return {
			all,
			new: newCount,
			open,
			waiting_for_citizen: waiting,
			resolved,
			rejected,
		};
	}

	async updateStatus(
		input: UpdateInquiryTicketStatusInput,
		actor: { id: string; role?: RoleType },
	): Promise<InquiryTicketResponse> {
		const { id, status, closureRemarks } = input;

		if (!this.isAssignee(actor.role)) {
			throw new AppError("AUTH.INSUFFICIENT_PERMISSIONS");
		}

		const inquiryTicket = await this.db.inquiryTicket.findFirst({
			where: { id },
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		if (!inquiryTicket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		if (inquiryTicket.assignedTo !== actor.id) {
			throw new AppError("AUTH.INSUFFICIENT_PERMISSIONS");
		}

		if (inquiryTicket.assignmentStatus !== "confirmed") {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		const updated = await this.db.inquiryTicket.update({
			where: { id },
			data: {
				status,
				...(closureRemarks && { closureRemarks }),
			},
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		// Send email notification when inquiry is resolved or rejected
		if (
			(status === "resolved" || status === "rejected") &&
			updated.citizenEmail
		) {
			const emailParam = updated.citizenEmail
				? `&email=${encodeURIComponent(updated.citizenEmail)}`
				: "";
			const portalUrl = `${this.config.getOrThrow("portalUrl")}/inquiries?ref=${encodeURIComponent(updated.referenceNumber)}${emailParam}`;

			console.log(
				`[InquiryTicket] Inquiry ${status}, sending email notification...`,
				{
					to: updated.citizenEmail,
					referenceNumber: updated.referenceNumber,
					status,
				},
			);

			this.resend
				.send({
					to: updated.citizenEmail,
					template: {
						id: "inquiry-resolution-email",
						variables: {
							CITIZEN_NAME: formatCitizenFullName(updated) ?? "",
							SUBJECT: updated.subject,
							STATUS: status,
							REFERENCE_NUMBER: updated.referenceNumber,
							STAFF_NAME: inquiryTicket.user?.fullName || "Staff Member",
							MESSAGE_CONTENT: closureRemarks || "No remarks provided",
							PORTAL_URL: portalUrl,
							YEAR: new Date().getFullYear().toString(),
						},
					},
				})
				.then((result) => {
					console.log(
						`[InquiryTicket] Resolution notification - Resend response:`,
						{
							success: !!result.data,
							emailId: result.data?.id,
							error: result.error,
							to: updated.citizenEmail,
							referenceNumber: updated.referenceNumber,
							status,
						},
					);
					if (result.error) {
						console.error(
							"[InquiryTicket] Resend returned an error:",
							result.error,
						);
					}
				})
				.catch((err) => {
					console.error(
						"[InquiryTicket] Failed to send resolution notification",
						{
							ticketId: updated.id,
							referenceNumber: updated.referenceNumber,
							status,
							error: err,
						},
					);
				});
		}

		return {
			...updated,
			createdAt: updated.createdAt.toISOString(),
		};
	}

	async assignTo(
		id: string,
		assignedTo: string | null,
		assigner: { id: string; role?: RoleType },
	): Promise<InquiryTicketResponse> {
		const ticket = await this.db.inquiryTicket.findFirst({
			where: { id },
		});

		if (!ticket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		if (!this.isAssigner(assigner.role)) {
			throw new AppError("AUTH.INSUFFICIENT_PERMISSIONS");
		}

		// Validate target user exists and is active before assigning
		if (assignedTo !== null) {
			const targetUser = await this.db.user.findFirst({
				where: {
					id: assignedTo,
					status: "active",
					role: { name: { in: INQUIRY_ASSIGNABLE_ROLES } },
				},
			});

			if (!targetUser) {
				throw new AppError("GENERAL.BAD_REQUEST");
			}
		}

		// Reassignment flow: if current assignment is confirmed, require approval
		if (
			assignedTo !== null &&
			ticket.assignedTo &&
			ticket.assignedTo !== assignedTo &&
			ticket.assignmentStatus === "confirmed"
		) {
			const updated = await this.db.inquiryTicket.update({
				where: { id },
				data: {
					pendingReassignmentTo: assignedTo,
					assignmentRequestedBy: assigner.id,
				},
				include: {
					user: {
						select: {
							id: true,
							fullName: true,
						},
					},
				},
			});

			return {
				...updated,
				createdAt: updated.createdAt.toISOString(),
			};
		}

		const updated = await this.db.inquiryTicket.update({
			where: { id },
			data: {
				assignedTo,
				assignmentStatus: assignedTo ? "pending" : "confirmed",
				assignmentRequestedBy: null,
				pendingReassignmentTo: null,
				// Auto-transition from 'new' to 'open' when assigned to someone
				...(assignedTo !== null &&
					ticket.status === "new" && { status: "open" }),
			},
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		return {
			...updated,
			createdAt: updated.createdAt.toISOString(),
		};
	}

	async requestAssignment(
		ticketId: string,
		requester: { id: string; role?: RoleType },
	): Promise<InquiryTicketResponse> {
		if (!this.isAssignee(requester.role) || this.isAssigner(requester.role)) {
			throw new AppError("AUTH.INSUFFICIENT_PERMISSIONS");
		}

		const ticket = await this.db.inquiryTicket.findFirst({
			where: { id: ticketId },
		});

		if (!ticket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		if (ticket.assignedTo) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		const updated = await this.db.inquiryTicket.update({
			where: { id: ticketId },
			data: {
				assignmentRequestedBy: requester.id,
			},
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		return {
			...updated,
			createdAt: updated.createdAt.toISOString(),
		};
	}

	async confirmAssignment(
		ticketId: string,
		assignee: { id: string; role?: RoleType },
	): Promise<InquiryTicketResponse> {
		if (!this.isAssignee(assignee.role)) {
			throw new AppError("AUTH.INSUFFICIENT_PERMISSIONS");
		}

		const ticket = await this.db.inquiryTicket.findFirst({
			where: { id: ticketId },
		});

		if (!ticket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		if (ticket.assignedTo !== assignee.id) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		if (ticket.assignmentStatus !== "pending") {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		const updated = await this.db.inquiryTicket.update({
			where: { id: ticketId },
			data: {
				assignmentStatus: "confirmed",
				pendingReassignmentTo: null,
				assignmentRequestedBy: null,
			},
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		return {
			...updated,
			createdAt: updated.createdAt.toISOString(),
		};
	}

	async approveReassignment(
		ticketId: string,
		assignee: { id: string; role?: RoleType },
	): Promise<InquiryTicketResponse> {
		if (!this.isAssignee(assignee.role)) {
			throw new AppError("AUTH.INSUFFICIENT_PERMISSIONS");
		}

		const ticket = await this.db.inquiryTicket.findFirst({
			where: { id: ticketId },
		});

		if (!ticket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		if (ticket.assignedTo !== assignee.id || !ticket.pendingReassignmentTo) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		const updated = await this.db.inquiryTicket.update({
			where: { id: ticketId },
			data: {
				assignedTo: ticket.pendingReassignmentTo,
				assignmentStatus: "pending",
				pendingReassignmentTo: null,
				assignmentRequestedBy: null,
				...(ticket.status === "new" && { status: "open" }),
			},
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		return {
			...updated,
			createdAt: updated.createdAt.toISOString(),
		};
	}

	async rejectReassignment(
		ticketId: string,
		assignee: { id: string; role?: RoleType },
	): Promise<InquiryTicketResponse> {
		if (!this.isAssignee(assignee.role)) {
			throw new AppError("AUTH.INSUFFICIENT_PERMISSIONS");
		}

		const ticket = await this.db.inquiryTicket.findFirst({
			where: { id: ticketId },
		});

		if (!ticket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		if (ticket.assignedTo !== assignee.id || !ticket.pendingReassignmentTo) {
			throw new AppError("GENERAL.BAD_REQUEST");
		}

		const updated = await this.db.inquiryTicket.update({
			where: { id: ticketId },
			data: {
				pendingReassignmentTo: null,
				assignmentRequestedBy: null,
			},
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		return {
			...updated,
			createdAt: updated.createdAt.toISOString(),
		};
	}

	async assignToMe(
		ticketId: string,
		userId: string,
	): Promise<InquiryTicketResponse> {
		const ticket = await this.db.inquiryTicket.findFirst({
			where: { id: ticketId },
		});

		if (!ticket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		// FR-03: Assign to user and update status from 'new' to 'open'
		const updated = await this.db.inquiryTicket.update({
			where: { id: ticketId },
			data: {
				assignedTo: userId,
				assignmentStatus: "pending",
				pendingReassignmentTo: null,
				assignmentRequestedBy: null,
				// Auto-transition from 'new' to 'open' when assigned
				...(ticket.status === "new" && { status: "open" }),
			},
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		// Send email notification when inquiry is assigned (only if citizen provided email)
		if (!updated.citizenEmail) {
			return {
				...updated,
				createdAt: updated.createdAt.toISOString(),
			};
		}

		const emailParam = updated.citizenEmail
			? `&email=${encodeURIComponent(updated.citizenEmail)}`
			: "";
		const portalUrl = `${this.config.getOrThrow("portalUrl")}/inquiries?ref=${encodeURIComponent(updated.referenceNumber)}${emailParam}`;

		console.log(
			"[InquiryTicket] Inquiry assigned, sending email notification...",
			{
				to: updated.citizenEmail,
				referenceNumber: updated.referenceNumber,
				assignedTo: updated.user?.fullName,
			},
		);

		this.resend
			.send({
				to: updated.citizenEmail,
				template: {
					id: "assigned-inquiry",
					variables: {
						CITIZEN_NAME: formatCitizenFullName(updated) ?? "",
						REFERENCE_NUMBER: updated.referenceNumber,
						SUBJECT: updated.subject,
						STAFF_NAME: updated.user?.fullName || "Staff Member",
						PORTAL_URL: portalUrl,
						YEAR: new Date().getFullYear().toString(),
					},
				},
			})
			.then((result) => {
				console.log(
					"[InquiryTicket] Assignment notification - Resend response:",
					{
						success: !!result.data,
						emailId: result.data?.id,
						error: result.error,
						to: updated.citizenEmail,
						referenceNumber: updated.referenceNumber,
					},
				);
				if (result.error) {
					console.error(
						"[InquiryTicket] Resend returned an error:",
						result.error,
					);
				}
			})
			.catch((err) => {
				console.error(
					"[InquiryTicket] Failed to send assignment notification",
					{
						ticketId: updated.id,
						referenceNumber: updated.referenceNumber,
						error: err,
					},
				);
			});

		return {
			...updated,
			createdAt: updated.createdAt.toISOString(),
		};
	}

	/**
	 * Add signed attachment URLs to a message.
	 * Delegates to SupabaseStorageService for URL generation.
	 */
	private async addAttachmentUrlsToMessage(
		message: InquiryMessage,
	): Promise<InquiryMessageWithAttachments> {
		const attachments = await this.storageService.getSignedUrls(
			ATTACHMENTS_BUCKET,
			message.attachmentPaths ?? [],
		);

		return {
			...message,
			attachments,
		};
	}

	/**
	 * Generate signed upload URLs for inquiry attachments.
	 * The backend controls the bucket and generates unique paths for security.
	 */
	async createSignedUploadUrls(input: CreateSignedUploadUrlsInput) {
		const { folder, fileNames } = input;

		try {
			const paths = fileNames.map((fileName) =>
				this.storageService.generateUploadPath(folder, fileName),
			);

			const results = await this.storageService.createSignedUploadUrls(
				ATTACHMENTS_BUCKET,
				paths,
			);

			return {
				uploads: results.map((result, index) => ({
					fileName: fileNames[index],
					path: result.path,
					signedUrl: result.signedUrl,
					token: result.token,
				})),
			};
		} catch (error) {
			this.logger.error("Failed to generate signed upload URLs", error);

			if (error instanceof AppError) {
				throw error;
			}

			throw new AppError("STORAGE.SIGNED_URL_FAILED");
		}
	}

	private generateReferenceNumber(year: number): string {
		// Use uppercase alphanumeric (no ambiguous chars like O/0, I/1)
		const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);
		const shortYear = year.toString().slice(-2); // "26"
		const uniqueId = nanoid();
		// IC26-<uniqueId>
		return `IC${shortYear}-${uniqueId}`;
	}
}
