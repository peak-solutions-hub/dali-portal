import { InquiryCategory, InquiryStatus } from "../enums";

export const INQUIRY_CATEGORY_LABELS: Record<InquiryCategory, string> = {
	appointment_request: "Appointment Request",
	document_follow_up: "Document Follow-up",
	general_inquiry: "General Inquiry",
	request_for_assistance: "Request for Assistance",
};

/**
 * Converts inquiry category from schema format to user-readable format
 */
export function formatInquiryCategory(category: InquiryCategory): string {
	switch (category) {
		case "general_inquiry":
			return "General Inquiry";
		case "request_for_assistance":
			return "Request for Assistance";
		case "appointment_request":
			return "Appointment Request";
		case "document_follow_up":
			return "Document Follow-up";
		default:
			return category;
	}
}

/**
 * Converts inquiry status from schema format to user-readable format
 */
export function formatInquiryStatus(status: InquiryStatus): string {
	switch (status) {
		case "new":
			return "New";
		case "open":
			return "Open";
		case "waiting_for_citizen":
			return "Waiting for Citizen";
		case "resolved":
			return "Resolved";
		case "rejected":
			return "Rejected";
		default:
			return status;
	}
}
