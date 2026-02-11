import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import {
	type CreateInquiryTicketInput,
	type CreateInquiryTicketResponse,
	type GetInquiryTicketByIdInput,
	type GetInquiryTicketListInput,
	type InquiryTicketListResponse,
	type InquiryTicketResponse,
	type InquiryTicketWithMessagesResponse,
	TrackInquiryTicketInput,
	TrackInquiryTicketResponse,
	type UpdateInquiryTicketStatusInput,
} from "@repo/shared";
import { customAlphabet } from "nanoid";
import { DbService } from "@/app/db/db.service";
import { ResendService } from "@/lib/resend.service";

@Injectable()
export class InquiryTicketService {
	constructor(
		private readonly db: DbService,
		private readonly resend: ResendService,
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
				// create initial inquiry message
				// https://www.prisma.io/docs/orm/prisma-client/queries/transactions#nested-writes-1
				inquiryMessages: {
					create: [
						{
							senderName: input.citizenName,
							content: input.message,
							senderType: "citizen",
						},
					],
				},
			},
		});

		this.resend.send({
			to: response.citizenEmail,
			template: {
				id: "inquiry-confirmation",
				variables: {
					CITIZEN_NAME: response.citizenName,
					REFERENCE_NUMBER: response.referenceNumber,
					SUBJECT: response.subject,
					CATEGORY: response.category,
					YEAR: new Date().getFullYear(),
					PORTAL_URL: "http://localhost:3000",
				},
			},
		});

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

	async getWithMessages(
		input: GetInquiryTicketByIdInput,
	): Promise<InquiryTicketWithMessagesResponse> {
		const inquiryTicketWithMessages = await this.db.inquiryTicket.findFirst({
			where: { id: input.id },
			include: {
				inquiryMessages: {
					orderBy: { createdAt: "asc" },
				},
			},
		});

		if (!inquiryTicketWithMessages) {
			throw new ORPCError("NOT_FOUND");
		}

		return {
			...inquiryTicketWithMessages,
			createdAt: inquiryTicketWithMessages.createdAt.toISOString(),
			inquiryMessages: inquiryTicketWithMessages.inquiryMessages.map((msg) => ({
				...msg,
				createdAt: msg.createdAt.toISOString(),
			})),
		};
	}

	async getById(
		input: GetInquiryTicketByIdInput,
	): Promise<InquiryTicketResponse> {
		const inquiryTicket = await this.db.inquiryTicket.findFirst({
			where: { id: input.id },
		});

		if (!inquiryTicket) {
			throw new ORPCError("NOT_FOUND");
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

	async updateStatus(
		input: UpdateInquiryTicketStatusInput,
	): Promise<InquiryTicketResponse> {
		const { id, status, closureRemarks } = input;

		const inquiryTicket = await this.db.inquiryTicket.findFirst({
			where: { id },
		});

		if (!inquiryTicket) {
			throw new ORPCError("NOT_FOUND");
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

	private generateReferenceNumber(year: number): string {
		// Use uppercase alphanumeric (no ambiguous chars like O/0, I/1)
		const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);
		const shortYear = year.toString().slice(-2); // "26"
		const uniqueId = nanoid();
		// IC26-<uniqueId>
		return `IC${shortYear}-${uniqueId}`;
	}
}
