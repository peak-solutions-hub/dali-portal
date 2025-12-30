import { oc } from "@orpc/contract";
import { inquiryTicketContract } from "./contracts/inquiry-ticket.contract";
import { legislativeDocumentContract } from "./contracts/legislative-document.contract";

export const contract = oc.router({
	inquiries: inquiryTicketContract,
	legislativeDocuments: legislativeDocumentContract,
});

export type Contract = typeof contract;
