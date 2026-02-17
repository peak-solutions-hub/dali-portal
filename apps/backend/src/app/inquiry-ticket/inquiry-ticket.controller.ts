import { Controller } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { AppError, contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import { Captcha } from "@/app/captcha/captcha.guard";
import { InquiryTicketService } from "@/app/inquiry-ticket/inquiry-ticket.service";
import type { ORPCContext } from "@/app/types";
import { InquiryMessageService } from "./inquiry-message.service";

@Controller()
export class InquiryTicketController {
	constructor(
		private readonly inquiryService: InquiryTicketService,
		private readonly messageService: InquiryMessageService,
	) {}

	// 5 reqs per min
	@Throttle({
		default: {
			limit: 5,
			ttl: 60000,
		},
	})
	@Captcha({ skip: process.env.NODE_ENV === "test" })
	@Implement(contract.inquiries.create)
	create() {
		return implement(contract.inquiries.create).handler(async ({ input }) => {
			return await this.inquiryService.create(input);
		});
	}

	// 10 reqs per min
	@Throttle({
		default: {
			limit: 10,
			ttl: 60000,
		},
	})
	@Implement(contract.inquiries.track)
	track() {
		return implement(contract.inquiries.track).handler(async ({ input }) => {
			return await this.inquiryService.track(input);
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.inquiries.getWithMessages)
	getWithMessages() {
		return implement(contract.inquiries.getWithMessages).handler(
			async ({ input }) => {
				return await this.inquiryService.getWithMessages(input);
			},
		);
	}

	// 5 reqs per min
	@Throttle({
		default: {
			limit: 5,
			ttl: 60000,
		},
	})
	@Implement(contract.inquiries.sendMessage)
	sendMessage() {
		return implement(contract.inquiries.sendMessage).handler(
			async ({ input }) => {
				return await this.messageService.send(input);
			},
		);
	}

	// 10 reqs per min — generous for multi-file uploads
	@Throttle({
		default: {
			limit: 10,
			ttl: 60000,
		},
	})
	@Implement(contract.inquiries.createUploadUrls)
	createUploadUrls() {
		return implement(contract.inquiries.createUploadUrls).handler(
			async ({ input }) => {
				return await this.inquiryService.createSignedUploadUrls(input);
			},
		);
	}

	// Admin endpoints

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.inquiries.getList)
	getList() {
		return implement(contract.inquiries.getList).handler(async ({ input }) => {
			return await this.inquiryService.getList(input);
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.inquiries.getStatusCounts)
	getStatusCounts() {
		return implement(contract.inquiries.getStatusCounts).handler(async () => {
			return await this.inquiryService.getStatusCounts();
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.inquiries.getById)
	getById() {
		return implement(contract.inquiries.getById).handler(async ({ input }) => {
			return await this.inquiryService.getById(input);
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.inquiries.updateStatus)
	updateStatus() {
		return implement(contract.inquiries.updateStatus).handler(
			async ({ input }) => {
				return await this.inquiryService.updateStatus(input);
			},
		);
	}

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.INQUIRY_TICKETS)
	@Implement(contract.inquiries.assignToMe)
	assignToMe() {
		return implement(contract.inquiries.assignToMe).handler(
			async ({ input, context }) => {
				// Extract user ID from auth context
				const { request } = context as ORPCContext;
				const userId = request.user?.id;

				if (!userId) {
					throw new AppError("AUTH.AUTHENTICATION_REQUIRED");
				}

				return await this.inquiryService.assignToMe(input.id, userId);
			},
		);
	}
}
