import { oc } from "@orpc/contract";
import { assistanceRecordContract } from "./contracts/assistance-record.contract";
import { beneficiaryContract } from "./contracts/beneficiary.contract";
import { inquiryTicketContract } from "./contracts/inquiry-ticket.contract";
import { legislativeDocumentContract } from "./contracts/legislative-document.contract";
import { roleContract } from "./contracts/role.contract";
import { roomBookingContract } from "./contracts/room-booking.contract";
import { scholarshipApplicationContract } from "./contracts/scholarship-application.contract";
import { sessionContract } from "./contracts/session.contract";
import { userContract } from "./contracts/user.contract";
import { visitorLogContract } from "./contracts/visitor-log.contract";

export const contract = oc.router({
	inquiries: inquiryTicketContract,
	legislativeDocuments: legislativeDocumentContract,
	roles: roleContract,
	roomBookings: roomBookingContract,
	users: userContract,
	sessions: sessionContract,
	visitorLogs: visitorLogContract,
	beneficiaries: beneficiaryContract,
	assistanceRecords: assistanceRecordContract,
	scholarshipApplications: scholarshipApplicationContract,
});

export type Contract = typeof contract;
