import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import {
	type CreateInquiryTicketInput,
	type CreateInquiryTicketResponse,
	type GetInquiryTicketByIdInput,
	type InquiryTicket,
	InquiryTicketWithMessages,
	TrackInquiryTicketInput,
	TrackInquiryTicketResponse,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";

@Injectable()
export class InquiryTicketService {
	constructor(private readonly db: DbService) {}

	async create(
		input: CreateInquiryTicketInput,
	): Promise<CreateInquiryTicketResponse> {
		const referenceNumber = this.generateReferenceNumber();

		// create inquiry ticket
		await this.db.inquiryTicket.create({
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

		// TODO: send reference number and citizen email to user email

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
	): Promise<InquiryTicketWithMessages> {
		const inquiryTicketWithMessages = await this.db.inquiryTicket.findFirst({
			where: { id: input.id },
			include: {
				inquiryMessages: true,
			},
		});

		if (!inquiryTicketWithMessages) {
			throw new ORPCError("NOT_FOUND");
		}

		return inquiryTicketWithMessages;
	}

	async getById(input: GetInquiryTicketByIdInput): Promise<InquiryTicket> {
		const inquiryTicket = await this.db.inquiryTicket.findFirst({
			where: { id: input.id },
		});

		if (!inquiryTicket) {
			throw new ORPCError("NOT_FOUND");
		}

		return inquiryTicket;
	}

	private generateReferenceNumber(): string {
		return `test`;
	}
}
