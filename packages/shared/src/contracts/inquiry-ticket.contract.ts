import { oc } from "@orpc/contract";
import {
	CreateInquiryTicketResponseSchema,
	CreateInquiryTicketSchema,
	GetInquiryTicketByIdSchema,
	GetInquiryTicketListSchema,
	InquiryTicketListSchema,
	InquiryTicketSchema,
	UpdateInquiryTicketStatusSchema,
} from "../schemas/inquiry-ticket.schema";

// sample for now

export const createInquiryTicket = oc
	.route({
		method: "POST",
		path: "/inquiries",
		summary: "Submit a new inquiry",
		description:
			"Citizens submit inquiries via the public portal. Returns a reference number for tracking.",
		tags: ["Inquiry", "Public"],
	})
	.errors({
		// define possible errors here
	})
	.input(CreateInquiryTicketSchema)
	.output(CreateInquiryTicketResponseSchema);

export const getInquiryTicketList = oc
	.route({
		method: "GET",
		path: "/inquiries",
		summary: "Get list of inquiry tickets",
		description:
			"Staff retrieves list of inquiry tickets with optional filters.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		UNAUTHORIZED: {
			status: 401,
			description: "Unauthorized access",
		},
	})
	.input(GetInquiryTicketListSchema)
	.output(InquiryTicketListSchema);

export const getInquiryTicketById = oc
	.route({
		method: "GET",
		path: "/inquiries/{id}",
		summary: "Get inquiry details",
		description: "Staff retrieves full inquiry details.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		// define possible errors here
	})
	.input(GetInquiryTicketByIdSchema)
	.output(InquiryTicketSchema);

export const updateInquiryTicketStatus = oc
	.route({
		method: "PATCH",
		path: "/inquiries/{id}/status",
		summary: "Update inquiry status",
		description:
			"Staff updates inquiry status. Closure remarks required for RESOLVED/REJECTED.",
		tags: ["Inquiry", "Admin"],
	})
	.input(UpdateInquiryTicketStatusSchema)
	.output(InquiryTicketSchema);

export const inquiryTicketContract = {
	// for public portal
	create: createInquiryTicket,
	// TODO: add track, reply,

	// for admin
	getList: getInquiryTicketList,
	getById: getInquiryTicketById,
	updateStatus: updateInquiryTicketStatus,
};
