export const SessionSection = {
	INTRO: "intro",
	OPENING_PRAYER_INVOCATION: "opening_prayer_invocation",
	NATIONAL_ANTHEM_AND_PLEDGE_OF_ALLEGIANCE:
		"national_anthem_and_pledge_of_allegiance",
	ROLL_CALL: "roll_call",
	READING_AND_OR_APPROVAL_OF_MINUTES: "reading_and_or_approval_of_minutes",
	AGENDA: "agenda",
	FIRST_READING_AND_REFERENCES: "first_reading_and_references",
	COMMITTEE_REPORT: "committee_report",
	CALENDAR_OF_BUSINESS: "calendar_of_business",
	THIRD_READING: "third_reading",
	OTHER_MATTERS: "other_matters",
	CLOSING_PRAYER: "closing_prayer",
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
