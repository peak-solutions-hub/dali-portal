import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/contract";
import {
	ERRORS,
	INQUIRY_MAX_TOTAL_ATTACHMENTS,
	type InquiryMessage,
	type SendInquiryMessageInput,
} from "@repo/shared";
import { DbService } from "../db/db.service";

@Injectable()
export class InquiryMessageService {
	constructor(private readonly db: DbService) {}

	async send(input: SendInquiryMessageInput): Promise<InquiryMessage> {
		const newAttachmentCount = input.attachmentPaths?.length ?? 0;

		// server side validation for max attachments per inquiry conversation (you never know :))
		if (newAttachmentCount > 0) {
			const existingCount = await this.countAttachments(input.ticketId);

			if (existingCount + newAttachmentCount > INQUIRY_MAX_TOTAL_ATTACHMENTS) {
				throw new ORPCError("ATTACHMENT_LIMIT_EXCEEDED", {
					status: ERRORS.INQUIRY.ATTACHMENT_LIMIT_EXCEEDED.status,
					message: ERRORS.INQUIRY.ATTACHMENT_LIMIT_EXCEEDED.message,
				});
			}
		}

		return await this.db.inquiryMessage.create({
			data: input,
		});
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
