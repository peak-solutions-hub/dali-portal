import { oc } from "@orpc/contract";
import { inquiryTicketContract } from "./contracts/inquiry-ticket.contract";

export const contract = oc.router({
	inquiries: inquiryTicketContract,
});

export type Contract = typeof contract;
export type CreateInquiryTicketInput = typeof contract.inquiries.create;
