import { Controller } from "@nestjs/common";
import { Implement, implement, ORPCError } from "@orpc/nest";
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

	@Implement(contract.inquiries.getList)
	getList() {
		return implement(contract.inquiries.getList).handler(async ({ input }) => {
			// sample only to test error handling
			if (input.limit == 10) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "You are not authorized to view inquiries.",
				});
			}
			return await this.inquiryService.getList(input);
		});
	}

	@Implement(contract.inquiries.getById)
	getById() {
		return implement(contract.inquiries.getById).handler(async ({ input }) => {
			return await this.inquiryService.getById(input);
		});
	}

	@Implement(contract.inquiries.updateStatus)
	updateStatus() {
		return implement(contract.inquiries.updateStatus).handler(
			async ({ input }) => {
				return await this.inquiryService.updateStatus(input);
			},
		);
	}
}
