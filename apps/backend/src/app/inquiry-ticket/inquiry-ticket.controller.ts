import { Controller } from "@nestjs/common";
import { Impl, Implement, implement, ORPCError } from "@orpc/nest";
import { contract } from "@repo/shared";
import { InquiryTicketService } from "./inquiry-ticket.service";

@Controller()
export class InquiryTicketController {
	constructor(private readonly inquiryService: InquiryTicketService) {}

	@Implement(contract.inquiries.create)
	create() {
		return implement(contract.inquiries.create).handler(async ({ input }) => {
			return await this.inquiryService.create(input);
		});
	}

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
}
