import { Injectable } from "@nestjs/common";
import { InquiryMessage, SendInquiryMessageInput } from "@repo/shared";
import { DbService } from "../db/db.service";

@Injectable()
export class InquiryMessageService {
	constructor(private readonly db: DbService) {}

	async send(input: SendInquiryMessageInput): Promise<InquiryMessage> {
		return await this.db.inquiryMessage.create({
			data: input,
		});
	}
}
