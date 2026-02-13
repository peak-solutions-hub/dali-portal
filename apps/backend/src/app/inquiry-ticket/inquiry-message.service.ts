import { Injectable } from "@nestjs/common";
import {
	AppError,
	INQUIRY_MAX_TOTAL_ATTACHMENTS,
	type InquiryMessageResponse,
	type SendInquiryMessageInput,
} from "@repo/shared";
import { ResendService } from "@/lib/resend.service";
import { DbService } from "../db/db.service";

@Injectable()
export class InquiryMessageService {
	constructor(
		private readonly db: DbService,
		private readonly resend: ResendService,
	) {}

	async send(input: SendInquiryMessageInput): Promise<InquiryMessageResponse> {
		const newAttachmentCount = input.attachmentPaths?.length ?? 0;

		// Server-side validation for max attachments per inquiry conversation
		if (newAttachmentCount > 0) {
			const existingCount = await this.countAttachments(input.ticketId);

			if (existingCount + newAttachmentCount > INQUIRY_MAX_TOTAL_ATTACHMENTS) {
				throw new AppError("INQUIRY.ATTACHMENT_LIMIT_EXCEEDED");
			}
		}

		// Get inquiry ticket details (need citizen email and info)
		const inquiryTicket = await this.db.inquiryTicket.findUnique({
			where: { id: input.ticketId },
		});

		if (!inquiryTicket) {
			throw new AppError("INQUIRY.NOT_FOUND");
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

	/**
	 * Count total attachments across all messages in an inquiry conversation.
	 */
	async countAttachments(ticketId: string): Promise<number> {
		const messages = await this.db.inquiryMessage.findMany({
			where: { ticketId },
			select: { attachmentPaths: true },
		});

		return messages.reduce(
			(total, msg) => total + (msg.attachmentPaths?.length ?? 0),
			0,
		);
	}
}
