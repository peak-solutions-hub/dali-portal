import { oc } from "@orpc/contract";
import { inquiryTicketContract } from "./contracts/inquiry-ticket.contract";
import { legislativeDocumentContract } from "./contracts/legislative-document.contract";
import { roleContract } from "./contracts/role.contract";
import { userContract } from "./contracts/user.contract";

export const contract = oc.router({
	inquiries: inquiryTicketContract,
	legislativeDocuments: legislativeDocumentContract,
	roles: roleContract,
	users: userContract,
});

export type Contract = typeof contract;
