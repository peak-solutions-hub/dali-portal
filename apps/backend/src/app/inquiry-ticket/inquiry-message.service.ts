import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import { InquiryMessageResponse, SendInquiryMessageInput } from "@repo/shared";
import { ResendService } from "@/lib/resend.service";
import { DbService } from "../db/db.service";

@Injectable()
export class InquiryMessageService {
	constructor(
		private readonly db: DbService,
		private readonly resend: ResendService,
	) {}

	async send(input: SendInquiryMessageInput): Promise<InquiryMessageResponse> {
		// Get inquiry ticket details (need citizen email and info)
		const inquiryTicket = await this.db.inquiryTicket.findUnique({
			where: { id: input.ticketId },
		});

		if (!inquiryTicket) {
			throw new ORPCError("NOT_FOUND", { message: "Inquiry ticket not found" });
		}

		// Create the message
		const message = await this.db.inquiryMessage.create({
			data: input,
		});

		// Send email notification if staff replied to citizen
		if (message.senderType === "staff") {
			console.log("[InquiryTicket] Staff reply detected, sending email...", {
				to: inquiryTicket.citizenEmail,
				referenceNumber: inquiryTicket.referenceNumber,
			});

			this.resend
				.send({
					to: inquiryTicket.citizenEmail,
					template: {
						id: "admin-reply-notification",
						variables: {
							CITIZEN_NAME: inquiryTicket.citizenName,
							REFERENCE_NUMBER: inquiryTicket.referenceNumber,
							SUBJECT: inquiryTicket.subject,
							STAFF_NAME: message.senderName,
							MESSAGE_CONTENT: message.content,
							PORTAL_URL: "http://localhost:3000",
							YEAR: new Date().getFullYear().toString(),
						},
					},
				})
				.then((result) => {
					console.log(
						"[InquiryTicket] Staff reply notification - Resend response:",
						{
							success: !!result.data,
							emailId: result.data?.id,
							error: result.error,
							to: inquiryTicket.citizenEmail,
							referenceNumber: inquiryTicket.referenceNumber,
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
						"[InquiryTicket] Failed to send staff reply notification",
						{
							ticketId: inquiryTicket.id,
							referenceNumber: inquiryTicket.referenceNumber,
							error: err,
						},
					);
				});
		}

		return {
			...message,
			createdAt: message.createdAt.toISOString(),
		};
	}
}
