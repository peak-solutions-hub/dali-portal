import { Controller } from "@nestjs/common";
import { Implement, implement, ORPCError } from "@orpc/nest";
import { contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Public, Roles } from "@/app/auth";
import { InquiryTicketService } from "./inquiry-ticket.service";

@Controller()
export class InquiryTicketController {
	constructor(private readonly inquiryService: InquiryTicketService) {}

	// Public endpoint - citizens can submit inquiries
	@Public()
	@Implement(contract.inquiries.create)
	create() {
		return implement(contract.inquiries.create).handler(async ({ input }) => {
			return await this.inquiryService.create(input);
		});
	}

	// Admin endpoint - staff can view inquiry list
	@Roles(...ROLE_PERMISSIONS.INQUIRY_TICKETS)
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

	// Admin endpoint - staff can view inquiry details
	@Roles(...ROLE_PERMISSIONS.INQUIRY_TICKETS)
	@Implement(contract.inquiries.getById)
	getById() {
		return implement(contract.inquiries.getById).handler(async ({ input }) => {
			return await this.inquiryService.getById(input);
		});
	}

	// Admin endpoint - staff can update inquiry status
	@Roles(...ROLE_PERMISSIONS.INQUIRY_TICKETS)
	@Implement(contract.inquiries.updateStatus)
	updateStatus() {
		return implement(contract.inquiries.updateStatus).handler(
			async ({ input }) => {
				return await this.inquiryService.updateStatus(input);
			},
		);
	}
}
