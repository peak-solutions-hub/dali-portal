import {
	applyDecorators,
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UseGuards,
} from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import type { Request } from "express";
import { TurnstileService } from "@/lib/turnstile.service";

export function Captcha(): MethodDecorator & ClassDecorator {
	return applyDecorators(UseGuards(CaptchaGuard));
}

@Injectable()
export class CaptchaGuard implements CanActivate {
	constructor(private readonly turnstile: TurnstileService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// get captcha token from request
		const request = context.switchToHttp().getRequest<Request>();
		const body = request.body as Record<string, unknown>;
		const captchaToken = body?.captchaToken;

		if (!captchaToken) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Captcha verification required",
			});
		}

		if (typeof captchaToken !== "string") {
			throw new ORPCError("BAD_REQUEST", {
				message: "Invalid captcha token format",
			});
		}

		const remoteIp = this.getClientIp(request);

		// Verify token with Turnstile
		const result = await this.turnstile.validateToken(captchaToken, remoteIp);

		if (!result.success) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Captcha verification failed. Please try again.",
			});
		}

		return true;
	}

	/**
	 * Extract client IP from request headers.
	 * Priority: CF-Connecting-IP > X-Forwarded-For > socket.remoteAddress
	 */
	private getClientIp(request: Request): string | undefined {
		// Cloudflare's real client IP header
		const cfIp = request.headers["cf-connecting-ip"];
		if (typeof cfIp === "string") {
			return cfIp;
		}

		// Standard proxy header (first IP in chain is the client)
		const forwardedFor = request.headers["x-forwarded-for"];
		if (typeof forwardedFor === "string") {
			return forwardedFor.split(",")[0]?.trim();
		}
		if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
			return forwardedFor[0]?.split(",")[0]?.trim();
		}

		// Direct connection
		return request.socket?.remoteAddress;
	}
}
