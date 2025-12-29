import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import {
	type CreateInquiryTicketInput,
	type CreateInquiryTicketResponse,
	type GetInquiryTicketByIdInput,
	type GetInquiryTicketListInput,
	type InquiryTicket,
	type InquiryTicketList,
	type UpdateInquiryTicketStatusInput,
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

		await new Promise((resolve) => setTimeout(resolve, 1000));

		return { referenceNumber };
	}

	async getList(input: GetInquiryTicketListInput): Promise<InquiryTicketList> {
		// to change

		let inquiryTickets: InquiryTicket[] = [];

		if (input.cursor) {
			inquiryTickets = await this.db.inquiryTicket.findMany({
				cursor: { id: input.cursor },
				take: input.limit,
			});
		} else {
			inquiryTickets = await this.db.inquiryTicket.findMany({
				take: input.limit,
			});
		}

		return inquiryTickets;
	}

	async getById(input: GetInquiryTicketByIdInput): Promise<InquiryTicket> {
		const inquiryTicket = await this.db.inquiryTicket.findUnique({
			where: { id: input.id },
		});

		if (!inquiryTicket) {
			throw new ORPCError("Record not found");
		}

		return inquiryTicket;
	}

	async updateStatus(
		input: UpdateInquiryTicketStatusInput,
	): Promise<InquiryTicket> {
		// implement

		await new Promise((resolve) => setTimeout(resolve, 1000));
		return {
			assignedTo: "",
			category: "appointment_request",
			citizenEmail: "",
			citizenName: "",
			closureRemarks: null,
			createdAt: new Date(),
			id: "",
			referenceNumber: "",
			status: "new",
			subject: "",
		};
	}

	private generateReferenceNumber(): string {
		return `test`;
	}
}
