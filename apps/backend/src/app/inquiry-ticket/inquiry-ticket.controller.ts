import { Controller } from "@nestjs/common";
import { Implement, implement, ORPCError } from "@orpc/nest";
import { contract, RoleType } from "@repo/shared";
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
	@Roles(
		RoleType.IT_ADMIN,
		RoleType.HEAD_ADMIN,
		RoleType.ADMIN_STAFF,
		RoleType.OVM_STAFF,
	)
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
	@Roles(
		RoleType.IT_ADMIN,
		RoleType.HEAD_ADMIN,
		RoleType.ADMIN_STAFF,
		RoleType.OVM_STAFF,
	)
	@Implement(contract.inquiries.getById)
	getById() {
		return implement(contract.inquiries.getById).handler(async ({ input }) => {
			return await this.inquiryService.getById(input);
		});
	}

	// Admin endpoint - staff can update inquiry status
	@Roles(
		RoleType.IT_ADMIN,
		RoleType.HEAD_ADMIN,
		RoleType.ADMIN_STAFF,
		RoleType.OVM_STAFF,
	)
	@Implement(contract.inquiries.updateStatus)
	updateStatus() {
		return implement(contract.inquiries.updateStatus).handler(
			async ({ input }) => {
				return await this.inquiryService.updateStatus(input);
			},
		);
	}
}
