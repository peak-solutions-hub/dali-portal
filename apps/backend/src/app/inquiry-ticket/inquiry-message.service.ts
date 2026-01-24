import { Injectable } from "@nestjs/common";
import { InquiryMessageResponse, SendInquiryMessageInput } from "@repo/shared";
import { DbService } from "../db/db.service";

@Injectable()
export class InquiryMessageService {
	constructor(private readonly db: DbService) {}

	async send(input: SendInquiryMessageInput): Promise<InquiryMessageResponse> {
		const message = await this.db.inquiryMessage.create({
			data: input,
		});

		return {
			...message,
			createdAt: message.createdAt.toISOString(),
		};
	}
}
