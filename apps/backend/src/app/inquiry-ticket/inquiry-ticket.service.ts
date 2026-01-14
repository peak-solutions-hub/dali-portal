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
import { customAlphabet } from "nanoid";
import { DbService } from "@/app/db/db.service";
import {
	generateInquiryConfirmationEmail,
	generateInquiryConfirmationText,
} from "@/lib/email-templates/inquiry-confirmation.template";
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

		// verify turnstile token
		const turnstileResponse = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					secret: process.env.TURNSTILE_SECRET_KEY!,
					// TODO: add turnstile token to input schema
					response: input.captchaToken || "",
				}),
			},
		);

		const turnstileResult = await turnstileResponse.json();
		if (!turnstileResult.success) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Security verification failed",
			});
		}

		// send confirmation email to citizen
		const emailData = {
			citizenName: input.citizenName,
			referenceNumber,
			subject: input.subject,
			category: input.category,
		};

		this.resend.send({
			to: input.citizenEmail,
			subject: `Inquiry Received: ${referenceNumber}`,
			html: generateInquiryConfirmationEmail(emailData),
			text: generateInquiryConfirmationText(emailData),
			from: "DALI Portal <noreply@dali-portal.josearron.dev>",
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

	private generateReferenceNumber(year: number): string {
		// Use uppercase alphanumeric (no ambiguous chars like O/0, I/1)
		const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);
		const shortYear = year.toString().slice(-2); // "26"
		const uniqueId = nanoid();
		// IC26-<uniqueId>
		return `IC${shortYear}-${uniqueId}`;
	}
}
