import { Module } from "@nestjs/common";
import { CaptchaGuard } from "@/app/captcha/captcha.guard";
import { InquiryMessageService } from "./inquiry-message.service";
import { InquiryTicketController } from "./inquiry-ticket.controller";
import { InquiryTicketService } from "./inquiry-ticket.service";

@Module({
	controllers: [InquiryTicketController],
	providers: [InquiryTicketService, InquiryMessageService, CaptchaGuard],
	exports: [InquiryTicketService],
})
export class InquiryTicketModule {}
