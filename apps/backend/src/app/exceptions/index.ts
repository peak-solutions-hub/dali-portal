/**
 * Exception Filters Index
 *
 * This module exports all exception filters used globally in the application.
 * These filters transform various error types into oRPC-compatible error responses.
 *
 * ## Available Filters
 *
 * ### Prisma Filters
 * - `PrismaClientExceptionFilter` - Handles Prisma known request errors (P2xxx codes)
 * - `PrismaValidationExceptionFilter` - Handles Prisma validation errors
 * - `PrismaInitializationExceptionFilter` - Handles database connection failures
 * - `PrismaUnknownExceptionFilter` - Handles unknown Prisma errors
 * - `PrismaRustPanicExceptionFilter` - Handles critical Rust engine panics
 *
 * ### Rate Limiting
 * - `ThrottlerExceptionFilter` - Handles rate limit exceeded errors
 *
 * ## Usage
 *
 * All filters are registered globally in AppModule:
 * ```typescript
 * providers: [
 *   { provide: APP_FILTER, useClass: PrismaClientExceptionFilter },
 *   { provide: APP_FILTER, useClass: ThrottlerExceptionFilter },
 *   // ...
 * ]
 * ```
 */

export {
	PrismaClientExceptionFilter,
	PrismaInitializationExceptionFilter,
	PrismaRustPanicExceptionFilter,
	PrismaUnknownExceptionFilter,
	PrismaValidationExceptionFilter,
} from "./prisma-client-exception.filter";
export { ThrottlerExceptionFilter } from "./throttler-exception.filter";
