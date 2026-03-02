/**
 * Checks if an error message is related to CAPTCHA validation.
 * CAPTCHA errors include validation failures and token expiration.
 */
export function isCaptchaError(errorMessage: string): boolean {
	if (!errorMessage) return false;

	const captchaKeywords = [
		"security check",
		"captcha",
		"verification failed",
		"token",
		"expired",
		"turnstile",
	];

	const lowerError = errorMessage.toLowerCase();
	return captchaKeywords.some((keyword) => lowerError.includes(keyword));
}
