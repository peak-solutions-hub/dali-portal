import { ORPCError } from "@orpc/contract";
import type { Get, Paths, Split } from "type-fest";

/**
 * Application error definitions.
 * - Domain keys should be UPPERCASE and SINGULAR (e.g., GENERAL, INQUIRY)
 * - Error keys should be UPPERCASE with underscores (e.g., NOT_FOUND, TOO_MANY_REQUESTS)
 * - Each error must have `status` (HTTP status code) and `message` (user-friendly message)
 */
export const ERRORS = {
	GENERAL: {
		TOO_MANY_REQUESTS: {
			status: 429,
			message: "Too many requests. Please try again later.",
		},
		UNAUTHORIZED: {
			status: 401,
			message: "Authentication required.",
		},
		FORBIDDEN: {
			status: 403,
			message: "You don't have permission to perform this action.",
		},
		NOT_FOUND: {
			status: 404,
			message: "The requested resource was not found.",
		},
		BAD_REQUEST: {
			status: 400,
			message: "Invalid request. Please check your input.",
		},
		INTERNAL_SERVER_ERROR: {
			status: 500,
			message: "An unexpected error occurred. Please try again.",
		},
		CONFLICT: {
			status: 409,
			message: "This resource already exists or conflicts with existing data.",
		},
	},
	INQUIRY: {
		NOT_FOUND: {
			status: 404,
			message: "Inquiry not found.",
		},
		CAPTCHA_VALIDATION_FAILED: {
			status: 400,
			message:
				"We couldn't verify the security check. Please try submitting again. If it still doesn't work, refresh this page and try once more.",
		},
		CAPTCHA_TOKEN_SPENT_OR_EXPIRED: {
			status: 409,
			message:
				"Your security check has expired. Please submit your inquiry again so we can run a fresh security check.",
		},
		ATTACHMENT_LIMIT_EXCEEDED: {
			status: 400,
			message:
				"This inquiry has reached the maximum number of attachments. Please send without files.",
		},
		MESSAGE_SEND_FAILED: {
			status: 400,
			message: "Unable to send the message. Please try again.",
		},
		EMAIL_SEND_FAILED: {
			status: 500,
			message: "Failed to send email. Please try again later.",
		},
		CREATION_FAILED: {
			status: 500,
			message: "Failed to create inquiry ticket. Please try again later.",
		},
	},
	DOCUMENT: {
		NOT_FOUND: {
			status: 404,
			message: "Document not found.",
		},
		INVALID_TRANSITION: {
			status: 400,
			message: "Invalid status transition.",
		},
		DUPLICATE_CODE: {
			status: 409,
			message: "A document with this tracking number already exists.",
		},
		VERSION_CONFLICT: {
			status: 409,
			message: "Document status has changed. Please refresh.",
		},
		EDIT_LOCKED: {
			status: 403,
			message:
				"This field cannot be changed once the document has entered the approval workflow.",
		},
		DELETE_TERMINAL_STATUS: {
			status: 409,
			message: "Published or released documents cannot be deleted.",
		},
		LINKED_TO_SESSION_AGENDA: {
			status: 409,
			message:
				"This document cannot be deleted because it is linked to a session agenda. Remove the agenda link first.",
		},
		INVITATION_ON_COMPLETED_SLIP: {
			status: 409,
			message:
				"This invitation is part of a completed Caller's Slip and cannot be removed from it.",
		},
	},
	CALLER_SLIP: {
		NOT_FOUND: {
			status: 404,
			message: "Caller's Slip not found.",
		},
		ALREADY_COMPLETED: {
			status: 409,
			message:
				"This Caller's Slip has already been completed and cannot be modified.",
		},
		INVITATION_ALREADY_ASSIGNED: {
			status: 409,
			message:
				"One or more selected invitations are already assigned to a Caller's Slip.",
		},
		INVITATION_NOT_INVITATION_TYPE: {
			status: 400,
			message: "One or more selected documents are not of type invitation.",
		},
		EMPTY_BATCH: {
			status: 400,
			message:
				"At least one invitation must be selected to generate a Caller's Slip.",
		},
	},
	STORAGE: {
		SIGNED_URL_FAILED: {
			status: 500,
			message: "Failed to generate file access URL. Please try again.",
		},
		UPLOAD_FAILED: {
			status: 500,
			message: "Failed to upload file. Please try again.",
		},
		FILE_NOT_FOUND: {
			status: 404,
			message: "The requested file was not found.",
		},
		BUCKET_NOT_FOUND: {
			status: 404,
			message: "Storage bucket not found.",
		},
	},
	SESSION: {
		NOT_FOUND: {
			status: 404,
			message: "Session not found.",
		},
		DUPLICATE_DATE: {
			status: 409,
			message: "A session already exists for this date.",
		},
		INVALID_STATUS_TRANSITION: {
			status: 400,
			message: "This status transition is not allowed.",
		},
		NOT_DRAFT: {
			status: 400,
			message: "Session must be in draft status for this operation.",
		},
		NOT_SCHEDULED: {
			status: 400,
			message: "Session must be in scheduled status for this operation.",
		},
		DELETE_NOT_DRAFT: {
			status: 400,
			message: "Only draft sessions can be deleted.",
		},
		CREATION_FAILED: {
			status: 500,
			message: "Failed to create session. Please try again.",
		},
		INVALID_DATE_RANGE: {
			status: 400,
			message: 'The "From" date cannot be later than the "To" date.',
		},
		LIST_FAILED: {
			status: 500,
			message: "Failed to load sessions.",
		},
		FETCH_FAILED: {
			status: 500,
			message: "Failed to load session details.",
		},
		SAVE_FAILED: {
			status: 500,
			message: "Failed to save session draft. Please try again.",
		},
		PUBLISH_FAILED: {
			status: 500,
			message: "Failed to publish session. Please try again.",
		},
		UNPUBLISH_FAILED: {
			status: 500,
			message: "Failed to unpublish session. Please try again.",
		},
		COMPLETE_FAILED: {
			status: 500,
			message: "Failed to mark session as completed. Please try again.",
		},
		DELETE_FAILED: {
			status: 500,
			message: "Failed to delete session. Please try again.",
		},
		REMOVE_ITEM_FAILED: {
			status: 500,
			message: "Failed to remove agenda item. Please try again.",
		},
		AGENDA_UPLOAD_FAILED: {
			status: 500,
			message: "Failed to upload session agenda. Please try again.",
		},
		AGENDA_SAVE_FAILED: {
			status: 500,
			message: "Failed to save agenda PDF. Please try again.",
		},
		AGENDA_DELETE_FAILED: {
			status: 500,
			message: "Failed to remove agenda PDF. Please try again.",
		},
	},
	AUTH: {
		MISSING_TOKEN: {
			status: 401,
			message: "Missing or invalid Authorization header.",
		},
		INVALID_TOKEN: {
			status: 401,
			message: "Invalid or expired token.",
		},
		DEACTIVATED_ACCOUNT: {
			status: 401,
			message: "User account is deactivated.",
		},
		TOKEN_VERIFICATION_FAILED: {
			status: 401,
			message: "Token verification failed.",
		},
		AUTHENTICATION_REQUIRED: {
			status: 401,
			message: "Authentication required.",
		},
		INSUFFICIENT_PERMISSIONS: {
			status: 403,
			message: "Access denied. Insufficient permissions.",
		},
	},
	USER: {
		NOT_FOUND: {
			status: 404,
			message: "User not found.",
		},
		NOT_AUTHENTICATED: {
			status: 401,
			message: "User not authenticated.",
		},
		INVALID_ROLE: {
			status: 400,
			message: "Invalid role specified.",
		},
		SELF_DEMOTION: {
			status: 403,
			message:
				"You cannot change your own IT Admin role. Ask another IT Admin to update your role.",
		},
		ALREADY_ACTIVE: {
			status: 400,
			message: "User is already active or cannot be activated.",
		},
		DEACTIVATED_SUGGEST_REACTIVATION: {
			status: 400,
			message:
				"This email belongs to a deactivated user. Please reactivate their account instead.",
		},
		EMAIL_ALREADY_EXISTS: {
			status: 409,
			message: "User with this email already exists and is active.",
		},
		INVITE_FAILED: {
			status: 500,
			message: "Failed to create or invite user. Please try again.",
		},
		DB_CREATE_FAILED: {
			status: 500,
			message: "Failed to create user in database.",
		},
		RESET_EMAIL_FAILED: {
			status: 500,
			message: "Failed to send password reset email. Please try again.",
		},
	},
	ROOM_BOOKING: {
		NOT_FOUND: {
			status: 404,
			message: "Room booking not found.",
		},
		CONFLICT: {
			status: 409,
			message:
				"The selected room is already occupied for this date and time. Please choose a different room or adjust the schedule.",
		},
		PAST_BOOKING: {
			status: 400,
			message: "Cannot book a time slot in the past.",
		},
		FORBIDDEN: {
			status: 403,
			message: "You don't have permission to modify this booking.",
		},
		INVALID_TIME_RANGE: {
			status: 400,
			message:
				"Start time must be before end time and the duration must be at least 15 minutes.",
		},
		INVALID_ATTACHMENT: {
			status: 400,
			message:
				"Attachment must be PDF, PNG, JPG/JPEG, DOC, or DOCX, and must not exceed 5MB.",
		},
		CANNOT_APPROVE: {
			status: 400,
			message: "Only pending bookings can be approved or rejected.",
		},
	},
} as const;

/**
 * Extract all valid error paths as dot-separated strings.
 * Example: "GENERAL.NOT_FOUND" | "INQUIRY.NOT_FOUND"
 */
export type ErrorCode = Paths<
	typeof ERRORS,
	{ bracketNotation: false; depth: 1 }
>;

/**
 * Extract the error definition object from a given error code path.
 * Example: Get<typeof ERRORS, "GENERAL.NOT_FOUND"> => { status: 404, message: "..." }
 */
export type ErrorDefinition<T extends ErrorCode = ErrorCode> = Get<
	typeof ERRORS,
	T
>;

/**
 * Type-safe application error class.
 * Accepts only valid error codes from the ERRORS constant.
 *
 * @example
 * throw new AppError("GENERAL.NOT_FOUND")
 * throw new AppError("INQUIRY.MESSAGE_SEND_FAILED")
 */
export class AppError extends ORPCError<ErrorCode, Record<string, never>> {
	constructor(code: ErrorCode, message?: string) {
		const parts = code.split(".") as Split<typeof code, ".">;

		if (parts.length !== 2) {
			throw new Error(
				`Invalid error code format: ${code}. Expected format: "DOMAIN.ERROR_KEY"`,
			);
		}

		const [domain, errorKey] = parts;
		const errorDef = AppError.getErrorDefinition(domain, errorKey);

		if (!errorDef) {
			throw new Error(`Error definition not found for code: ${code}`);
		}

		super(code, {
			message: message ?? errorDef.message,
			status: errorDef.status,
			data: {},
		});
	}

	static getErrorDefinition(
		domain: string,
		errorKey: string,
	): { status: number; message: string } | undefined {
		const domainErrors = ERRORS[domain as keyof typeof ERRORS];
		if (!domainErrors) return undefined;

		return domainErrors[errorKey as keyof typeof domainErrors] as {
			status: number;
			message: string;
		};
	}

	/**
	 * Helper method to create error with additional context data
	 * Example:
	 * throw AppError.withData("GENERAL.BAD_REQUEST", { field: "email" });
	 *
	 */
	static withData<T extends ErrorCode>(
		code: T,
		data: Record<string, unknown>,
	): ORPCError<T, Record<string, unknown>> {
		const error = new AppError(code);
		return new ORPCError(code, {
			message: error.message,
			data,
		});
	}
}
