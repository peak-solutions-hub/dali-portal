import { Injectable, Logger } from "@nestjs/common";

import { ConfigService } from "./config.service";

interface TurnstileVerifyResponse {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	"error-codes"?: string[];
	action?: string;
	cdata?: string;
}

/**
 * Service for validating Cloudflare Turnstile captcha tokens.
 *
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
@Injectable()
export class TurnstileService {
	private readonly logger = new Logger(TurnstileService.name);
	private readonly secretKey: string;
	private readonly timeout: number;

	constructor(configService: ConfigService) {
		this.secretKey = configService.getOrThrow("turnstile.secretKey");
		this.timeout = configService.get("turnstile.timeout") ?? 10000;
	}

	/**
	 * Validate a Turnstile token with Cloudflare's siteverify API.
	 *
	 * @param token - The token from the client-side widget (cf-turnstile-response)
	 * @param remoteIp - Optional visitor IP for additional validation
	 * @returns Validation result with success status and any error codes
	 */
	async validateToken(
		token: string,
		remoteIp?: string,
	): Promise<TurnstileVerifyResponse> {
		// Input validation
		if (!token || typeof token !== "string") {
			return { success: false, "error-codes": ["invalid-input-response"] };
		}

		if (token.length > 2048) {
			return { success: false, "error-codes": ["invalid-input-response"] };
		}

		try {
			const body = new URLSearchParams();
			body.append("secret", this.secretKey);
			body.append("response", token);

			if (remoteIp) {
				body.append("remoteip", remoteIp);
			}

			const response = await fetch(
				"https://challenges.cloudflare.com/turnstile/v0/siteverify",
				{
					method: "POST",
					body,
					signal: AbortSignal.timeout(this.timeout),
				},
			);

			const data: TurnstileVerifyResponse = await response.json();

			if (!data.success) {
				this.logger.warn("Turnstile validation failed", {
					errorCodes: data["error-codes"],
					hostname: data.hostname,
				});
			}

			return data;
		} catch (error) {
			this.logger.error("Turnstile API error", error);
			return { success: false, "error-codes": ["internal-error"] };
		}
	}
}
