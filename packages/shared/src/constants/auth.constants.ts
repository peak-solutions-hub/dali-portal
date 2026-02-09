/**
 * Authentication and Session Constants
 *
 * Centralized configuration for auth-related settings across the monorepo.
 * Import from @repo/shared to use in both frontend and backend.
 */

/**
 * Public routes that don't require authentication.
 * Used by the proxy for route protection.
 */
export const PUBLIC_ROUTES = [
	"/login",
	"/auth/callback",
	"/auth/confirm",
	"/unauthorized",
	"/forgot-password",
	"/set-password",
] as const;

/**
 * Routes that authenticated users should be redirected away from.
 * Typically auth-related pages that don't make sense when logged in.
 */
export const AUTH_ONLY_ROUTES = ["/login", "/forgot-password"] as const;

/**
 * Allowed redirect paths after authentication.
 * Used to prevent open redirect vulnerabilities.
 */
export const ALLOWED_REDIRECT_PATHS = [
	"/",
	"/dashboard",
	"/document-tracker",
	"/caller-slips",
	"/session-management",
	"/inquiry-tickets",
	"/visitor-and-beneficiary-hub",
	"/conference-room",
	"/user-management",
	"/set-password",
	"/auth/confirm",
] as const;

/**
 * Default redirect path after successful authentication.
 */
export const DEFAULT_REDIRECT_PATH = "/dashboard" as const;

/**
 * Profile cache configuration
 */
export const PROFILE_CACHE = {
	/** Duration in milliseconds before profile cache expires */
	TTL_MS: 60_000, // 1 minute
	/** Storage key for profile cache */
	STORAGE_KEY: "dali-profile-cache",
} as const;

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
	/** Storage key for Supabase auth token */
	STORAGE_KEY: "sb-auth-token",
	/** Cookie name for auth session */
	COOKIE_NAME: "sb-auth-token",
	/** Cookie options */
	COOKIE_OPTIONS: {
		path: "/",
		sameSite: "lax" as const,
		secure: process.env.NODE_ENV === "production",
	},
} as const;

/**
 * Auth event debounce configuration
 */
export const AUTH_DEBOUNCE = {
	/** Debounce delay in milliseconds for auth state changes */
	DELAY_MS: 100,
} as const;

/**
 * Type helpers
 */
export type PublicRoute = (typeof PUBLIC_ROUTES)[number];
export type AuthOnlyRoute = (typeof AUTH_ONLY_ROUTES)[number];
export type AllowedRedirectPath = (typeof ALLOWED_REDIRECT_PATHS)[number];

/**
 * Check if a path is a public route
 */
export function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is an auth-only route (should redirect authenticated users)
 */
export function isAuthOnlyRoute(pathname: string): boolean {
	return AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Validate and sanitize a redirect path
 * Returns the path if valid, otherwise returns the default redirect path
 */
export function validateRedirectPath(path: string | null): string {
	if (!path) return DEFAULT_REDIRECT_PATH;

	// Must start with /
	if (!path.startsWith("/")) return DEFAULT_REDIRECT_PATH;

	// Check against whitelist (prefix match)
	const isAllowed = ALLOWED_REDIRECT_PATHS.some(
		(allowed) => path === allowed || path.startsWith(`${allowed}/`),
	);

	return isAllowed ? path : DEFAULT_REDIRECT_PATH;
}
