import { Controller } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { Captcha } from "@/app/captcha/captcha.guard";
import { InquiryMessageService } from "./inquiry-message.service";
import { InquiryTicketService } from "./inquiry-ticket.service";

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

	// 5 reqs per min
	@Throttle({
		default: {
			limit: 5,
			ttl: 60000,
		},
	})
	@Implement(contract.inquiries.track)
	track() {
		return implement(contract.inquiries.track).handler(async ({ input }) => {
			return await this.inquiryService.track(input);
		});
	}

	@SkipThrottle()
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
}
