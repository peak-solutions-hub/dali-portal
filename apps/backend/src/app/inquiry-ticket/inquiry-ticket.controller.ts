import { Controller } from "@nestjs/common";
import { Implement, implement, ORPCError } from "@orpc/nest";
import { contract } from "@repo/shared";
import { InquiryMessageService } from "./inquiry-message.service";
import { InquiryTicketService } from "./inquiry-ticket.service";

@Controller()
export class InquiryTicketController {
	constructor(
		private readonly inquiryService: InquiryTicketService,
		private readonly messageService: InquiryMessageService,
	) {}

	// TODO: add captcha token validation

	// TODO: add rate limiting
	@Implement(contract.inquiries.create)
	create() {
		return implement(contract.inquiries.create).handler(async ({ input }) => {
			return await this.inquiryService.create(input);
		});
	}

	// TODO: add rate limiting
	@Implement(contract.inquiries.track)
	track() {
		return implement(contract.inquiries.track).handler(async ({ input }) => {
			return await this.inquiryService.track(input);
		});
	}

	@Implement(contract.inquiries.getWithMessages)
	getWithMessages() {
		return implement(contract.inquiries.getWithMessages).handler(
			async ({ input }) => {
				return await this.inquiryService.getWithMessages(input);
			},
		);
	}

	// TODO: add rate limiting
	@Implement(contract.inquiries.sendMessage)
	sendMessage() {
		return implement(contract.inquiries.sendMessage).handler(
			async ({ input }) => {
				return await this.messageService.send(input);
			},
		);
	}
}
