import {
	applyDecorators,
	BadRequestException,
	type CanActivate,
	ConflictException,
	type ExecutionContext,
	Injectable,
	SetMetadata,
	UseGuards,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ERRORS } from "@repo/shared";
import type { Request } from "express";
import { TurnstileService } from "@/lib/turnstile.service";

const CAPTCHA_OPTIONS_KEY = "captchaOptions";

type CaptchaErrorCode = "VALIDATION_FAILED" | "TOKEN_SPENT_OR_EXPIRED";

/**
 * Options for the @Captcha() decorator
 */
export interface CaptchaOptions {
	/**
	 * Skip captcha validation. Useful for testing or development.
	 * @default false
	 */
	skip?: boolean;
}

/**
 * Decorator that applies captcha validation to a controller method.
 *
 * Uses Cloudflare Turnstile for captcha verification.
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Captcha()
 * @Implement(contract.inquiries.create)
 * create() { ... }
 * // Skip validation (for tests)
 * @Captcha({ skip: process.env.NODE_ENV === 'test' })
 * @Implement(contract.inquiries.create)
 * create() { ... }
 * ```
 */
export function Captcha(
	options?: CaptchaOptions,
): MethodDecorator & ClassDecorator {
	return applyDecorators(
		SetMetadata(CAPTCHA_OPTIONS_KEY, options ?? {}),
		UseGuards(CaptchaGuard),
	);
}

/**
 * NestJS Guard for Cloudflare Turnstile captcha validation.
 */
@Injectable()
export class CaptchaGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly turnstile: TurnstileService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Read options from @Captcha() decorator metadata
		const options = this.reflector.getAllAndOverride<CaptchaOptions>(
			CAPTCHA_OPTIONS_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (options.skip) {
			return true;
		}

		//  get captcha token from request body
		const request = context.switchToHttp().getRequest<Request>();
		const token = request.body.captchaToken;

		// Verify token with Cloudflare Turnstile
		const result = await this.turnstile.validateToken(token);

		if (!result.success) {
			const turnstileErrorCodes = result["error-codes"] ?? [];

			const captchaErrorCode: CaptchaErrorCode = turnstileErrorCodes.includes(
				"timeout-or-duplicate",
			)
				? "TOKEN_SPENT_OR_EXPIRED"
				: "VALIDATION_FAILED";

			if (captchaErrorCode === "TOKEN_SPENT_OR_EXPIRED") {
				throw new ConflictException(
					ERRORS.INQUIRY.CAPTCHA_TOKEN_SPENT_OR_EXPIRED.message,
				);
			}

			throw new BadRequestException(
				ERRORS.INQUIRY.CAPTCHA_VALIDATION_FAILED.message,
			);
		}

		return true;
	}
}
