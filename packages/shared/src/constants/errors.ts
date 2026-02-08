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

		super(code, { message: message ?? errorDef.message, data: {} });
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
