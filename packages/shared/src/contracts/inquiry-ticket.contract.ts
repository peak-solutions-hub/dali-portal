import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	ApproveInquiryReassignmentSchema,
	AssignInquiryTicketSchema,
	AssignInquiryToMeSchema,
	ConfirmInquiryAssignmentSchema,
	CreateInquiryTicketResponseSchema,
	CreateInquiryTicketSchema,
	GetInquiryStatusCountsSchema,
	GetInquiryTicketByIdSchema,
	GetInquiryTicketListSchema,
	InquiryMessageResponseSchema,
	InquiryMessageSchema,
	InquiryStatusCountsSchema,
	InquiryTicketListResponseSchema,
	InquiryTicketResponseSchema,
	InquiryTicketSchema,
	InquiryTicketWithMessagesAndAttachmentsSchema,
	InquiryTicketWithMessagesResponseSchema,
	RejectInquiryReassignmentSchema,
	RequestInquiryAssignmentSchema,
	SendInquiryMessageSchema,
	TrackInquiryTicketResponseSchema,
	TrackInquiryTicketSchema,
	UpdateInquiryTicketStatusSchema,
} from "../schemas/inquiry-ticket.schema";
import {
	CreateSignedUploadUrlsSchema,
	SignedUploadUrlsResponseSchema,
} from "../schemas/storage.schema";

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
		TOO_MANY_REQUESTS: ERRORS.GENERAL.TOO_MANY_REQUESTS,
		CREATION_FAILED: ERRORS.INQUIRY.CREATION_FAILED,
	})
	.input(CreateInquiryTicketSchema)
	.output(CreateInquiryTicketResponseSchema);

export const trackInquiryTicket = oc
	.route({
		method: "GET",
		path: "/inquiries/track",
		summary: "Track inquiry status",
		description:
			"Citizens track inquiry status using their reference number and contact number.",
		tags: ["Inquiry", "Public"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		TOO_MANY_REQUESTS: ERRORS.GENERAL.TOO_MANY_REQUESTS,
	})
	.input(TrackInquiryTicketSchema)
	.output(TrackInquiryTicketResponseSchema);

export const sendInquiryMessage = oc
	.route({
		method: "POST",
		path: "/inquiries/{ticketId}/messages",
		summary: "Send message on inquiry",
		description: "Citizens and staff can send messages on an inquiry.",
		tags: ["Inquiry", "Public", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		TOO_MANY_REQUESTS: ERRORS.GENERAL.TOO_MANY_REQUESTS,
		ATTACHMENT_LIMIT_EXCEEDED: ERRORS.INQUIRY.ATTACHMENT_LIMIT_EXCEEDED,
		MESSAGE_SEND_FAILED: ERRORS.INQUIRY.MESSAGE_SEND_FAILED,
	})
	.input(SendInquiryMessageSchema)
	.output(InquiryMessageResponseSchema);

export const getInquiryTicketWithMessages = oc
	.route({
		method: "GET",
		path: "/inquiries/{id}/messages",
		summary: "Get inquiry details with messages and attachment URLs",
		description:
			"Citizens and staff retrieve full inquiry details with messages. Attachments include pre-signed download URLs (valid for 1 hour).",
		tags: ["Inquiry", "Public", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
	})
	.input(GetInquiryTicketByIdSchema)
	.output(InquiryTicketWithMessagesAndAttachmentsSchema);

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
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetInquiryTicketListSchema)
	.output(InquiryTicketListResponseSchema);

export const getInquiryTicketById = oc
	.route({
		method: "GET",
		path: "/inquiries/{id}",
		summary: "Get inquiry details",
		description: "Staff retrieves full inquiry details.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
	})
	.input(GetInquiryTicketByIdSchema)
	.output(InquiryTicketResponseSchema);

export const updateInquiryTicketStatus = oc
	.route({
		method: "PATCH",
		path: "/inquiries/{id}/status",
		summary: "Update inquiry status",
		description:
			"Staff updates inquiry status. Closure remarks required for RESOLVED/REJECTED.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(UpdateInquiryTicketStatusSchema)
	.output(InquiryTicketResponseSchema);

export const getInquiryStatusCounts = oc
	.route({
		method: "GET",
		path: "/inquiries/status-counts",
		summary: "Get inquiry status counts",
		description:
			"Get counts of inquiries grouped by status in a single request, with optional search/filter params.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetInquiryStatusCountsSchema)
	.output(InquiryStatusCountsSchema);

export const assignInquiryToMe = oc
	.route({
		method: "PATCH",
		path: "/inquiries/{id}/assign-to-me",
		summary: "Assign inquiry to current user",
		description:
			"Eligible assigners assign the inquiry ticket to themselves. Status changes from 'new' to 'open' if applicable.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(AssignInquiryToMeSchema)
	.output(InquiryTicketResponseSchema);

export const assignInquiryTicket = oc
	.route({
		method: "PATCH",
		path: "/inquiries/{id}/assign",
		summary: "Assign inquiry to a staff member",
		description:
			"Staff assigns an inquiry ticket to another staff member or council member. Pass null to unassign.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(AssignInquiryTicketSchema)
	.output(InquiryTicketResponseSchema);

export const requestInquiryAssignment = oc
	.route({
		method: "PATCH",
		path: "/inquiries/{id}/request-assignment",
		summary: "Request assignment for an inquiry",
		description:
			"Eligible assignees can request to handle an unassigned inquiry ticket.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(RequestInquiryAssignmentSchema)
	.output(InquiryTicketResponseSchema);

export const confirmInquiryAssignment = oc
	.route({
		method: "PATCH",
		path: "/inquiries/{id}/confirm-assignment",
		summary: "Confirm assigned inquiry",
		description: "Assignee confirms they will handle the inquiry ticket.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(ConfirmInquiryAssignmentSchema)
	.output(InquiryTicketResponseSchema);

export const approveInquiryReassignment = oc
	.route({
		method: "PATCH",
		path: "/inquiries/{id}/approve-reassignment",
		summary: "Approve reassignment request",
		description:
			"Current assignee approves a pending reassignment to another staff member.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(ApproveInquiryReassignmentSchema)
	.output(InquiryTicketResponseSchema);

export const rejectInquiryReassignment = oc
	.route({
		method: "PATCH",
		path: "/inquiries/{id}/reject-reassignment",
		summary: "Reject reassignment request",
		description: "Current assignee rejects a pending reassignment request.",
		tags: ["Inquiry", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.INQUIRY.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(RejectInquiryReassignmentSchema)
	.output(InquiryTicketResponseSchema);

export const createInquiryUploadUrls = oc
	.route({
		method: "POST",
		path: "/inquiries/upload-urls",
		summary: "Generate signed upload URLs for inquiry attachments",
		description:
			"Generates pre-signed upload URLs for direct file uploads to Supabase Storage. URLs expire after 60 seconds.",
		tags: ["Inquiry", "Public"],
	})
	.errors({
		TOO_MANY_REQUESTS: ERRORS.GENERAL.TOO_MANY_REQUESTS,
		SIGNED_URL_FAILED: ERRORS.STORAGE.SIGNED_URL_FAILED,
	})
	.input(CreateSignedUploadUrlsSchema)
	.output(SignedUploadUrlsResponseSchema);

export const inquiryTicketContract = {
	sendMessage: sendInquiryMessage,
	getWithMessages: getInquiryTicketWithMessages,
	// for public portal
	create: createInquiryTicket,
	track: trackInquiryTicket,
	createUploadUrls: createInquiryUploadUrls,

	// for admin
	getList: getInquiryTicketList,
	getById: getInquiryTicketById,
	updateStatus: updateInquiryTicketStatus,
	getStatusCounts: getInquiryStatusCounts,
	assignToMe: assignInquiryToMe,
	assignTicket: assignInquiryTicket,
	requestAssignment: requestInquiryAssignment,
	confirmAssignment: confirmInquiryAssignment,
	approveReassignment: approveInquiryReassignment,
	rejectReassignment: rejectInquiryReassignment,
};
