/**
 * Error message substrings that reliably indicate a network-level failure
 * rather than a bug in application code.
 *
 * • "Failed to fetch"                 — Chrome / Firefox / Edge fetch API
 * • "Load failed"                     — Safari fetch API
 * • "NetworkError"                    — Firefox XHR / fetch error prefix
 * • "The network connection was lost" — Safari SSR stream interruption
 *
 * Intentionally excluded:
 * • "terminated"  — too generic; matches unrelated app errors (e.g. "session
 *                   terminated", "request terminated by user").
 * • "fetch failed" — Node.js undici (server-side). This boundary only runs in
 *                   the browser so that error can never reach it.
 */
const NETWORK_ERROR_FINGERPRINTS = [
	"Failed to fetch",
	"Load failed",
	"NetworkError",
	"The network connection was lost",
] as const;

export function isNetworkError(error: Error): boolean {
	// navigator.onLine === false is a definitive offline signal (reliable even
	// on Safari). The typeof guard is needed because getDerivedStateFromError
	// can be invoked during SSR when navigator is not defined.
	if (typeof navigator !== "undefined" && !navigator.onLine) return true;

	// error.cause being a TypeError is a strong hint of a low-level network
	// failure (e.g. a fetch() rejection wrapped by undici or the browser).
	if (error.cause instanceof TypeError) return true;

	// Error.prototype.message is always a string (spec-initialised to ""), so
	// no nullish coalescing fallback is needed here.
	return NETWORK_ERROR_FINGERPRINTS.some((fingerprint) =>
		error.message.includes(fingerprint),
	);
}
