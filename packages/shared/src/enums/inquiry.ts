export const InquiryCategory = {
	GENERAL_INQUIRY: "general_inquiry",
	REQUEST_FOR_ASSISTANCE: "request_for_assistance",
	APPOINTMENT_REQUEST: "appointment_request",
	DOCUMENT_FOLLOW_UP: "document_follow_up",
} as const;

export type InquiryCategory =
	(typeof InquiryCategory)[keyof typeof InquiryCategory];
export const INQUIRY_CATEGORY_VALUES: InquiryCategory[] =
	Object.values(InquiryCategory);

export const InquiryStatus = {
	NEW: "new",
	OPEN: "open",
	WAITING_FOR_CITIZEN: "waiting_for_citizen",
	RESOLVED: "resolved",
	REJECTED: "rejected",
} as const;

export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];
export const INQUIRY_STATUS_VALUES: InquiryStatus[] =
	Object.values(InquiryStatus);

export const InquiryMessageSenderType = {
	CITIZEN: "citizen",
	STAFF: "staff",
} as const;
export type InquiryMessageSenderType =
	(typeof InquiryMessageSenderType)[keyof typeof InquiryMessageSenderType];

export const SENDER_TYPE_VALUES: InquiryMessageSenderType[] = Object.values(
	InquiryMessageSenderType,
);
