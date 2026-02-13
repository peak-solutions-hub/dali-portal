import { Injectable, Logger } from "@nestjs/common";
import {
	AppError,
	type CreateInquiryTicketInput,
	type CreateInquiryTicketResponse,
	type CreateSignedUploadUrlsInput,
	type GetInquiryTicketByIdInput,
	type GetInquiryTicketListInput,
	INQUIRY_CATEGORY_LABELS,
	type InquiryMessage,
	type InquiryMessageWithAttachments,
	type InquiryStatusCounts,
	type InquiryTicket,
	type InquiryTicketListResponse,
	type InquiryTicketResponse,
	type InquiryTicketWithMessagesAndAttachments,
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

		// create inquiry ticket
		const response = await this.db.inquiryTicket.create({
			data: {
				referenceNumber,
				citizenEmail: input.citizenEmail,
				citizenName: input.citizenName,
				category: input.category,
				subject: input.subject,
				status: "new",
				// create initial inquiry message with optional attachments
				// https://www.prisma.io/docs/orm/prisma-client/queries/transactions#nested-writes-1
				inquiryMessages: {
					create: [
						{
							senderName: input.citizenName,
							content: input.message,
							senderType: "citizen",
							attachmentPaths: input.attachmentPaths ?? [],
						},
					],
				},
			},
		});

		// send confirmation email
		const portalUrl = `${this.config.getOrThrow("portalUrl")}/inquiries?ref=${encodeURIComponent(response.referenceNumber)}&email=${encodeURIComponent(response.citizenEmail)}`;

		const emailRes = await this.resend.send({
			to: response.citizenEmail,
			template: {
				id: "inquiry-confirmation",
				variables: {
					CITIZEN_NAME: response.citizenName,
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

		return { referenceNumber };
	}

	async track(
		input: TrackInquiryTicketInput,
	): Promise<TrackInquiryTicketResponse | null> {
		// fetch inquiry ticket by reference number and citizen email
		const ticketId = await this.db.inquiryTicket.findFirst({
			where: input,
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
	): Promise<InquiryTicketResponse> {
		const { id, status, closureRemarks } = input;

		const inquiryTicket = await this.db.inquiryTicket.findFirst({
			where: { id },
		});

		if (!inquiryTicket) {
			throw new AppError("INQUIRY.NOT_FOUND");
		}

		const updated = await this.db.inquiryTicket.update({
			where: { id },
			data: {
				status,
				...(closureRemarks && { closureRemarks }),
			},
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
