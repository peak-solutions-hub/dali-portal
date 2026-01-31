import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpStatus,
	Logger,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { ERRORS } from "@repo/shared";
import { Response } from "express";

/**
 * Exception filter for rate limiting (throttler) errors.
 *
 * Catches `ThrottlerException` from @nestjs/throttler and transforms it
 * into an oRPC-compatible error response with HTTP 429 status.
 *
 * Rate limits are configured in AppModule:
 * - "short": 3 requests per second (bot protection)
 * - "default": 60 requests per minute (user protection)
 *
 * Individual endpoints can override these limits using @Throttle() decorator.
 *
 * @example
 * // Controller with custom rate limit
 * @Throttle({ default: { limit: 5, ttl: 60000 } })
 * @Implement(contract.inquiries.create)
 * create() { ... }
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(ThrottlerExceptionFilter.name);

	catch(_exception: ThrottlerException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		// Log rate limit hit for monitoring
		this.logger.warn(
			`Rate limit exceeded: ${request.method} ${request.url} from ${request.ip}`,
		);

		response.status(HttpStatus.TOO_MANY_REQUESTS).json({
			defined: true,
			code: "TOO_MANY_REQUESTS",
			...ERRORS.GENERAL.TOO_MANY_REQUESTS,
		});
	}
}
