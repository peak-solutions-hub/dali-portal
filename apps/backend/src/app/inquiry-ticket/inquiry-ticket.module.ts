import { Module } from "@nestjs/common";
import { InquiryTicketController } from "./inquiry-ticket.controller";
import { InquiryTicketService } from "./inquiry-ticket.service";

@Module({
	controllers: [InquiryTicketController],
	providers: [InquiryTicketService],
	exports: [InquiryTicketService],
})
export class InquiryTicketModule {}
