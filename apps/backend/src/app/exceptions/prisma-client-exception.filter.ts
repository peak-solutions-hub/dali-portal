import { ArgumentsHost, Catch, HttpStatus, Logger } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { ERRORS } from "@repo/shared";
import { Response } from "express";
import { Prisma } from "generated/prisma/client";

/**
 * Prisma error code mappings to HTTP status codes and user-friendly messages.
 *
 * Prisma error codes reference: https://www.prisma.io/docs/orm/reference/error-reference
 *
 * Error code categories:
 * - P1xxx: Common/Connection errors
 * - P2xxx: Query Engine (Client) errors
 * - P3xxx: Migration Engine errors (not typically thrown at runtime)
 * - P4xxx: Introspection errors (not typically thrown at runtime)
 * - P5xxx/P6xxx: Accelerate/Pulse errors (if using Prisma Data Platform)
 */
const PRISMA_ERROR_MAP: Record<
	string,
	{ status: number; message: string; code?: string }
> = {
	// ================================
	// P1xxx: Common/Connection Errors
	// ================================
	P1000: {
		status: HttpStatus.SERVICE_UNAVAILABLE,
		message: "Database connection failed. Please try again later.",
		code: "DATABASE_AUTH_FAILED",
	},
	P1001: {
		status: HttpStatus.SERVICE_UNAVAILABLE,
		message: "Unable to reach the database. Please try again later.",
		code: "DATABASE_UNREACHABLE",
	},
	P1002: {
		status: HttpStatus.GATEWAY_TIMEOUT,
		message: "Database connection timed out. Please try again.",
		code: "DATABASE_TIMEOUT",
	},
	P1008: {
		status: HttpStatus.GATEWAY_TIMEOUT,
		message: "Operation timed out. Please try again.",
		code: "OPERATION_TIMEOUT",
	},
	P1017: {
		status: HttpStatus.SERVICE_UNAVAILABLE,
		message: "Database connection was closed. Please try again.",
		code: "CONNECTION_CLOSED",
	},

	// ================================
	// P2xxx: Query Engine (Client) Errors
	// ================================
	P2000: {
		status: HttpStatus.BAD_REQUEST,
		message: "The provided value is too long for this field.",
		code: "VALUE_TOO_LONG",
	},
	P2001: {
		status: HttpStatus.NOT_FOUND,
		message: "The requested record was not found.",
		code: "RECORD_NOT_FOUND",
	},
	P2002: {
		status: HttpStatus.CONFLICT,
		message: "A record with this value already exists.",
		code: "UNIQUE_CONSTRAINT_VIOLATION",
	},
	P2003: {
		status: HttpStatus.BAD_REQUEST,
		message: "Invalid reference to a related record.",
		code: "FOREIGN_KEY_VIOLATION",
	},
	P2004: {
		status: HttpStatus.BAD_REQUEST,
		message: "A database constraint was violated.",
		code: "CONSTRAINT_VIOLATION",
	},
	P2005: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Invalid data stored in database.",
		code: "INVALID_STORED_VALUE",
	},
	P2006: {
		status: HttpStatus.BAD_REQUEST,
		message: "The provided value is not valid for this field.",
		code: "INVALID_VALUE",
	},
	P2007: {
		status: HttpStatus.BAD_REQUEST,
		message: "Data validation failed.",
		code: "DATA_VALIDATION_ERROR",
	},
	P2010: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Raw query failed. Please contact support.",
		code: "RAW_QUERY_FAILED",
	},
	P2011: {
		status: HttpStatus.BAD_REQUEST,
		message: "A required field cannot be null.",
		code: "NULL_CONSTRAINT_VIOLATION",
	},
	P2012: {
		status: HttpStatus.BAD_REQUEST,
		message: "A required value is missing.",
		code: "MISSING_REQUIRED_VALUE",
	},
	P2013: {
		status: HttpStatus.BAD_REQUEST,
		message: "A required argument is missing.",
		code: "MISSING_REQUIRED_ARGUMENT",
	},
	P2014: {
		status: HttpStatus.BAD_REQUEST,
		message: "This change would break a required relationship.",
		code: "RELATION_VIOLATION",
	},
	P2015: {
		status: HttpStatus.NOT_FOUND,
		message: "A related record could not be found.",
		code: "RELATED_RECORD_NOT_FOUND",
	},
	P2016: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Query interpretation error.",
		code: "QUERY_INTERPRETATION_ERROR",
	},
	P2017: {
		status: HttpStatus.BAD_REQUEST,
		message: "Related records are not connected.",
		code: "RECORDS_NOT_CONNECTED",
	},
	P2018: {
		status: HttpStatus.NOT_FOUND,
		message: "Required connected records were not found.",
		code: "CONNECTED_RECORDS_NOT_FOUND",
	},
	P2019: {
		status: HttpStatus.BAD_REQUEST,
		message: "Invalid input data.",
		code: "INPUT_ERROR",
	},
	P2020: {
		status: HttpStatus.BAD_REQUEST,
		message: "Value is out of range for this field type.",
		code: "VALUE_OUT_OF_RANGE",
	},
	P2021: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Database table does not exist.",
		code: "TABLE_NOT_FOUND",
	},
	P2022: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Database column does not exist.",
		code: "COLUMN_NOT_FOUND",
	},
	P2023: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Inconsistent column data.",
		code: "INCONSISTENT_COLUMN_DATA",
	},
	P2024: {
		status: HttpStatus.SERVICE_UNAVAILABLE,
		message: "Database connection pool exhausted. Please try again.",
		code: "CONNECTION_POOL_TIMEOUT",
	},
	P2025: {
		status: HttpStatus.NOT_FOUND,
		message: "Record not found.",
		code: "RECORD_NOT_FOUND",
	},
	P2026: {
		status: HttpStatus.BAD_REQUEST,
		message: "This operation is not supported.",
		code: "UNSUPPORTED_FEATURE",
	},
	P2027: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Multiple database errors occurred.",
		code: "MULTIPLE_ERRORS",
	},
	P2028: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Transaction failed.",
		code: "TRANSACTION_ERROR",
	},
	P2029: {
		status: HttpStatus.BAD_REQUEST,
		message: "Query parameter limit exceeded.",
		code: "PARAMETER_LIMIT_EXCEEDED",
	},
	P2030: {
		status: HttpStatus.BAD_REQUEST,
		message: "Fulltext index required for this search.",
		code: "FULLTEXT_INDEX_REQUIRED",
	},
	P2033: {
		status: HttpStatus.BAD_REQUEST,
		message: "Number is too large for this field.",
		code: "NUMBER_TOO_LARGE",
	},
	P2034: {
		status: HttpStatus.CONFLICT,
		message: "Transaction failed due to a conflict. Please retry your request.",
		code: "WRITE_CONFLICT",
	},
	P2035: {
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		message: "Database assertion violation.",
		code: "ASSERTION_VIOLATION",
	},
	P2037: {
		status: HttpStatus.SERVICE_UNAVAILABLE,
		message: "Too many database connections. Please try again later.",
		code: "TOO_MANY_CONNECTIONS",
	},
};

/**
 * Exception filter for Prisma Client known request errors.
 *
 * Catches `PrismaClientKnownRequestError` exceptions and transforms them
 * into oRPC-compatible error responses with appropriate HTTP status codes.
 *
 * Errors are logged for debugging but user-facing messages are sanitized
 * to prevent information leakage.
 *
 * @example
 * // Unique constraint violation (P2002) returns 409 Conflict
 * // Record not found (P2025) returns 404 Not Found
 * // Connection issues (P1xxx) return 503 Service Unavailable
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(PrismaClientExceptionFilter.name);

	catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		// Log full error for debugging (includes meta info like affected fields)
		this.logger.error(
			`Prisma error ${exception.code}: ${exception.message}`,
			exception.stack,
		);

		// Get error mapping or use default
		const errorMapping = PRISMA_ERROR_MAP[exception.code];

		if (errorMapping) {
			response.status(errorMapping.status).json({
				defined: true,
				code: errorMapping.code,
				status: errorMapping.status,
				message: errorMapping.message,
			});
		} else {
			// Unknown Prisma error - log and return generic 500
			this.logger.warn(`Unhandled Prisma error code: ${exception.code}`);

			response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				defined: true,
				...ERRORS.GENERAL.INTERNAL_SERVER_ERROR,
			});
		}
	}
}

/**
 * Exception filter for Prisma Client validation errors.
 *
 * Catches `PrismaClientValidationError` which occur when the query
 * structure is invalid (e.g., missing required fields, wrong types).
 */
@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(PrismaValidationExceptionFilter.name);

	catch(exception: Prisma.PrismaClientValidationError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		// Log full error for debugging
		this.logger.error(`Prisma validation error: ${exception.message}`);

		// Return generic bad request (don't expose internal schema details)
		response.status(HttpStatus.BAD_REQUEST).json({
			defined: true,
			...ERRORS.GENERAL.BAD_REQUEST,
		});
	}
}

/**
 * Exception filter for Prisma Client initialization errors.
 *
 * Catches `PrismaClientInitializationError` which occur when
 * Prisma Client fails to initialize (database connection issues, etc.).
 */
@Catch(Prisma.PrismaClientInitializationError)
export class PrismaInitializationExceptionFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(
		PrismaInitializationExceptionFilter.name,
	);

	catch(
		exception: Prisma.PrismaClientInitializationError,
		host: ArgumentsHost,
	) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		// Log full error for debugging
		this.logger.error(
			`Prisma initialization error: ${exception.message}`,
			exception.stack,
		);

		// Return service unavailable
		response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
			defined: true,
			code: "DATABASE_INITIALIZATION_ERROR",
			status: HttpStatus.SERVICE_UNAVAILABLE,
			message:
				"Database service is temporarily unavailable. Please try again later.",
		});
	}
}

/**
 * Exception filter for Prisma Client unknown request errors.
 *
 * Catches `PrismaClientUnknownRequestError` which occur when the
 * query engine returns an error without a known error code.
 */
@Catch(Prisma.PrismaClientUnknownRequestError)
export class PrismaUnknownExceptionFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(PrismaUnknownExceptionFilter.name);

	catch(
		exception: Prisma.PrismaClientUnknownRequestError,
		host: ArgumentsHost,
	) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		// Log full error for debugging
		this.logger.error(
			`Prisma unknown error: ${exception.message}`,
			exception.stack,
		);

		// Return generic internal server error
		response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			defined: true,
			...ERRORS.GENERAL.INTERNAL_SERVER_ERROR,
		});
	}
}

/**
 * Exception filter for Prisma Client Rust panic errors.
 *
 * Catches `PrismaClientRustPanicError` which are critical errors
 * that occur when the underlying Rust engine crashes.
 */
@Catch(Prisma.PrismaClientRustPanicError)
export class PrismaRustPanicExceptionFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(PrismaRustPanicExceptionFilter.name);

	catch(exception: Prisma.PrismaClientRustPanicError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		// Log critical error
		this.logger.error(
			`CRITICAL: Prisma Rust panic: ${exception.message}`,
			exception.stack,
		);

		// Return generic internal server error
		response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			defined: true,
			...ERRORS.GENERAL.INTERNAL_SERVER_ERROR,
		});
	}
}
