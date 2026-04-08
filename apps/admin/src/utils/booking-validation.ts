import {
	BUSINESS_HOUR_END_MINUTES,
	BUSINESS_HOUR_START_MINUTES,
	isPastDateTime,
	parseTimeToMinutes,
} from "@repo/shared";

export interface BookingValidationValues {
	room: string;
	date: Date | undefined;
	startTime: string;
	endTime: string;
	meetingType: string;
	meetingTypeOthers: string;
	title: string;
	requestedFor: string;
	attachments: unknown[];
}

export interface BookingValidationRoomConflict {
	disabled: boolean;
	note?: string;
}

export interface BookingValidationOptions {
	selectedRoomConflict?: BookingValidationRoomConflict | null;
	maxAttachments?: number;
	keptExistingAttachmentCount?: number;
}

export type BookingFieldErrors = Partial<
	Record<keyof BookingValidationValues, string>
>;

export function validateBookingForm(
	values: BookingValidationValues,
	options: BookingValidationOptions = {},
): BookingFieldErrors {
	const errors: BookingFieldErrors = {};

	if (!values.room) {
		errors.room = "Conference room is required.";
	} else if (options.selectedRoomConflict?.disabled) {
		errors.room = options.selectedRoomConflict.note
			? `Selected room is occupied for this schedule (${options.selectedRoomConflict.note}). Please choose another room or timeslot.`
			: "Selected room is occupied for this schedule. Please choose another room or timeslot.";
	}

	if (!values.date) {
		errors.date = "Date is required.";
	}

	if (!values.startTime) {
		errors.startTime = "Start time is required.";
	}

	if (!values.endTime) {
		errors.endTime = "End time is required.";
	}

	if (!values.title.trim()) {
		errors.title = "Title is required.";
	}

	if (!values.meetingType) {
		errors.meetingType = "Meeting type is required.";
	}

	if (values.meetingType === "others" && !values.meetingTypeOthers.trim()) {
		errors.meetingTypeOthers = "Please specify the meeting type.";
	}

	if (!values.requestedFor.trim()) {
		errors.requestedFor = "Requested for is required.";
	}

	const startMinutes = parseTimeToMinutes(values.startTime);
	const endMinutes = parseTimeToMinutes(values.endTime);

	if (
		startMinutes !== null &&
		endMinutes !== null &&
		endMinutes <= startMinutes
	) {
		errors.endTime = "End time must be later than start time.";
	}

	if (
		startMinutes !== null &&
		(startMinutes < BUSINESS_HOUR_START_MINUTES ||
			startMinutes > BUSINESS_HOUR_END_MINUTES)
	) {
		errors.startTime = "Start time must be between 8:00 AM and 5:00 PM.";
	}

	if (
		endMinutes !== null &&
		(endMinutes < BUSINESS_HOUR_START_MINUTES ||
			endMinutes > BUSINESS_HOUR_END_MINUTES)
	) {
		errors.endTime = "End time must be between 8:00 AM and 5:00 PM.";
	}

	if (
		values.date &&
		values.startTime &&
		isPastDateTime(values.date, values.startTime)
	) {
		errors.startTime = "Start time cannot be in the past.";
	}

	if (
		options.maxAttachments !== undefined &&
		options.keptExistingAttachmentCount !== undefined
	) {
		const totalAttachments =
			options.keptExistingAttachmentCount + values.attachments.length;
		if (totalAttachments > options.maxAttachments) {
			errors.attachments = `Maximum of ${options.maxAttachments} attachments is allowed.`;
		}
	}

	return errors;
}
