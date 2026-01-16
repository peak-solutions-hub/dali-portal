import { oc } from "@orpc/contract";
import { inquiryTicketContract } from "./contracts/inquiry-ticket.contract";
import { legislativeDocumentContract } from "./contracts/legislative-document.contract";
import { sessionContract } from "./contracts/session.contract";

export const contract = oc.router({
	inquiries: inquiryTicketContract,
	legislativeDocuments: legislativeDocumentContract,
	sessions: sessionContract,
});

export type Contract = typeof contract;
