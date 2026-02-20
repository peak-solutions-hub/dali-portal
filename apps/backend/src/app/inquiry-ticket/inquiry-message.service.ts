import { Injectable } from "@nestjs/common";
import {
	AppError,
	INQUIRY_MAX_TOTAL_ATTACHMENTS,
	type InquiryMessageResponse,
	type SendInquiryMessageInput,
} from "@repo/shared";
import { DbService } from "../db/db.service";

@Injectable()
export class InquiryMessageService {
	constructor(private readonly db: DbService) {}

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

		// FR-02: Check if this is NOT the initial message (initial message is created during inquiry creation)
		const messageCount = await this.db.inquiryMessage.count({
			where: { ticketId: input.ticketId },
		});

		const isNotInitialMessage = messageCount > 0;
		const shouldUpdateStatusForCitizen =
			input.senderType === "citizen" &&
			isNotInitialMessage &&
			(inquiryTicket.status === "waiting_for_citizen" ||
				inquiryTicket.status === "new");

		// FR-01: Auto-update status when staff replies
		const shouldUpdateStatusForStaff =
			input.senderType === "staff" &&
			(inquiryTicket.status === "new" || inquiryTicket.status === "open");

		// Create the message
		const message = await this.db.inquiryMessage.create({
			data: input,
		});

		// Update status if needed
		if (shouldUpdateStatusForStaff) {
			await this.db.inquiryTicket.update({
				where: { id: input.ticketId },
				data: { status: "waiting_for_citizen" },
			});
		} else if (shouldUpdateStatusForCitizen) {
			await this.db.inquiryTicket.update({
				where: { id: input.ticketId },
				data: { status: "open" },
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
