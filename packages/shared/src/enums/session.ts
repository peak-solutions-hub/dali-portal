export const SessionSection = {
	CALL_TO_ORDER: "call_to_order",
	OPENING_PRAYER_INVOCATION: "opening_prayer_invocation",
	NATIONAL_ANTHEM_AND_PLEDGE_OF_ALLEGIANCE:
		"national_anthem_and_pledge_of_allegiance",
	ROLL_CALL: "roll_call",
	READING_AND_OR_APPROVAL_OF_THE_MINUTES:
		"reading_and_or_approval_of_the_minutes",
	FIRST_READING_AND_REFERENCE_OF_BUSINESS:
		"first_reading_and_reference_of_business",
	COMMITTEE_REPORTS: "committee_reports",
	CALENDAR_OF_BUSINESS: "calendar_of_business",
	THIRD_READING: "third_reading",
	OTHER_MATTERS: "other_matters",
	CLOSING_PRAYERS: "closing_prayers",
	ADJOURNMENT: "adjournment",
} as const;

export type SessionSection =
	(typeof SessionSection)[keyof typeof SessionSection];
export const SESSION_SECTION_VALUES: SessionSection[] =
	Object.values(SessionSection);

export const SessionType = {
	REGULAR: "regular",
	SPECIAL: "special",
} as const;

export type SessionType = (typeof SessionType)[keyof typeof SessionType];
export const SESSION_TYPE_VALUES: SessionType[] = Object.values(SessionType);

export const SessionStatus = {
	DRAFT: "draft",
	SCHEDULED: "scheduled",
	COMPLETED: "completed",
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
export const SESSION_STATUS_VALUES: SessionStatus[] =
	Object.values(SessionStatus);
