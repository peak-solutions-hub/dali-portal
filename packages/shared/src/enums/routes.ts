/**
 * Route patterns that require authentication
 */
export const PROTECTED_ROUTES = [
	"/dashboard",
	"/document-tracker",
	"/caller-slips",
	"/session-management",
	"/inquiry-tickets",
	"/visitor-and-beneficiary-hub",
	"/conference-room",
	"/user-management",
] as const;

/**
 * Auth routes that authenticated users shouldn't access when already signed in
 */
export const PUBLIC_AUTH_ROUTES = [
	"/auth/sign-in",
	"/auth/forgot-password",
] as const;

/**
 * Password setup routes that require verification token
 */
export const PASSWORD_SETUP_ROUTES = [
	"/auth/set-password",
	"/auth/update-password",
] as const;

/**
 * Auth callback routes that handle email verification
 */
export const AUTH_CALLBACK_ROUTES = [
	"/auth/callback",
	"/auth/confirm",
] as const;

/**
 * Routes that should be allowed without authentication
 */
export const ALLOWED_UNAUTHENTICATED_ROUTES = [
	...AUTH_CALLBACK_ROUTES,
	...PUBLIC_AUTH_ROUTES,
	...PASSWORD_SETUP_ROUTES,
] as const;
