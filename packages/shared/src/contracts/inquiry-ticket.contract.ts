import { oc } from "@orpc/contract";
import {
	CreateInquiryTicketResponseSchema,
	CreateInquiryTicketSchema,
	GetInquiryTicketByIdSchema,
	GetInquiryTicketListSchema,
	InquiryMessageSchema,
	InquiryTicketListSchema,
	InquiryTicketSchema,
	InquiryTicketWithMessagesSchema,
	SendInquiryMessageSchema,
	TrackInquiryTicketResponseSchema,
	TrackInquiryTicketSchema,
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
		TOO_MANY_REQUESTS: {
			status: 429,
			description: "Too many requests. Please try again later.",
		},
	})
	.input(CreateInquiryTicketSchema)
	.output(CreateInquiryTicketResponseSchema);

export const trackInquiryTicket = oc
	.route({
		method: "GET",
		path: "/inquiries/track",
		summary: "Track inquiry status",
		description:
			"Citizens track inquiry status using their reference number and email.",
		tags: ["Inquiry", "Public"],
	})
	.errors({
		NOT_FOUND: {
			status: 404,
			description: "Inquiry not found.",
		},
	})
	.input(TrackInquiryTicketSchema)
	// null if not found
	.output(TrackInquiryTicketResponseSchema);

export const sendInquiryMessage = oc
	.route({
		method: "POST",
		path: "/inquiries/{id}/messages",
		summary: "Send message on inquiry",
		description: "Citizens and staff can send messages on an inquiry.",
		tags: ["Inquiry", "Public", "Admin"],
	})
	.errors({
		NOT_FOUND: {
			status: 404,
			description: "Inquiry not found",
		},
		TOO_MANY_REQUESTS: {
			status: 429,
			description: "Too many requests. Please try again later.",
		},
	})
	.input(SendInquiryMessageSchema)
	.output(InquiryMessageSchema);

export const getInquiryTicketWithMessages = oc
	.route({
		method: "GET",
		path: "/inquiries/{id}/messages",
		summary: "Get inquiry details with messages",
		description:
			"Citizens and staff retrieve full inquiry details with messages.",
		tags: ["Inquiry", "Public", "Admin"],
	})
	.errors({
		NOT_FOUND: {
			status: 404,
			description: "Inquiry not found",
		},
	})
	.input(GetInquiryTicketByIdSchema)
	.output(InquiryTicketWithMessagesSchema);

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
	sendMessage: sendInquiryMessage,
	getWithMessages: getInquiryTicketWithMessages,
	// for public portal
	create: createInquiryTicket,
	track: trackInquiryTicket,

	// for admin
	getList: getInquiryTicketList,
	getById: getInquiryTicketById,
	updateStatus: updateInquiryTicketStatus,
};
