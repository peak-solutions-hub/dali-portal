/**
 * Supabase Server Clients
 *
 * Server-side Supabase client factories for Next.js.
 * Supports middleware, server components, and route handlers.
 *
 * IMPORTANT: Import directly from this file, not through barrel exports.
 *
 *
 * @example Server Component
 * ```typescript
 * import { cookies } from 'next/headers';
 * import { createServerComponentClient } from '@repo/ui/lib/supabase/server-client';
 *
 * const cookieStore = await cookies();
 * const supabase = createServerComponentClient(cookieStore);
 * ```
 */

import {
	type CookieOptions,
	createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Cookie store interface compatible with Next.js cookies() API
 */
export interface CookieStore {
	getAll: () => { name: string; value: string }[];
	set?: (name: string, value: string, options?: CookieOptions) => void;
}

/**
 * Extended cookie store for middleware that can also modify request cookies
 */
export interface MiddlewareCookieStore extends CookieStore {
	set: (name: string, value: string, options?: CookieOptions) => void;
}

/**
 * Get Supabase environment variables
 */
function getSupabaseConfig() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			"Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file",
		);
	}

	return { supabaseUrl, supabaseAnonKey };
}

/**
 * Middleware cookie handler configuration
 */
export interface MiddlewareCookieHandlers {
	/** Get all cookies from the request */
	getCookies: () => { name: string; value: string }[];
	/** Called when Supabase needs to set cookies */
	onSetCookies: (
		cookies: { name: string; value: string; options: CookieOptions }[],
	) => void;
}

/**
 * Result from createMiddlewareClient
 */
export interface MiddlewareClientResult {
	supabase: SupabaseClient;
	user: { id: string; email?: string } | null;
}

/**
 * Create a Supabase client for Next.js middleware with automatic session refresh.
 *
 * This is a flexible pattern that works with any Next.js version by using
 * callback handlers for cookie operations.
 */
export async function createMiddlewareClient(
	handlers: MiddlewareCookieHandlers,
): Promise<MiddlewareClientResult> {
	const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

	const supabase = createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return handlers.getCookies();
			},
			setAll(
				cookiesToSet: { name: string; value: string; options: CookieOptions }[],
			) {
				handlers.onSetCookies(cookiesToSet);
			},
		},
	});

	// Important: Always use getUser() instead of getSession() for security
	// getSession() reads from cookies without validation
	// getUser() validates the JWT with Supabase servers
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return {
		supabase,
		user,
	};
}

/**
 * Create a Supabase server client for Server Components (read-only).
 *
 * Use this in Server Components where you need to read auth state
 * but don't need to modify cookies (middleware handles session refresh).
 */
export function createServerComponentClient(cookieStore: {
	getAll: () => { name: string; value: string }[];
}): SupabaseClient {
	const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

	return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll() {
				// Server Components cannot set cookies
				// Session refresh should happen in middleware
			},
		},
	});
}

/**
 * Create a Supabase server client for Route Handlers (Server Actions).
 *
 * Use this in API routes or Server Actions where you can write cookies.
 */
export function createRouteHandlerClient(cookieStore: {
	getAll: () => { name: string; value: string }[];
	set: (name: string, value: string, options?: CookieOptions) => void;
}): SupabaseClient {
	const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

	return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(
				cookiesToSet: { name: string; value: string; options: CookieOptions }[],
			) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// This can be ignored if middleware handles session refresh
				}
			},
		},
	});
}

/**
 * Create a Supabase client for server-side usage.
 *
 * This is a convenience function that creates a Supabase client
 * using the cookies() API from Next.js.
 *
 * @example
 * ```typescript
 * const supabase = await createSupabaseClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export async function createSupabaseClient(): Promise<SupabaseClient> {
	const cookieStore = await cookies();
	const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

	return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(
				cookiesToSet: { name: string; value: string; options: CookieOptions }[],
			) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// The `setAll` method was called from a Server Component.
					// This can be ignored if you have middleware refreshing user sessions.
				}
			},
		},
	});
}

/**
 * Get the current user from the server.
 *
 * @returns The current user or null if not authenticated
 *
 * @example
 * ```typescript
 * const user = await getUser();
 * if (!user) {
 *   redirect('/auth/sign-in');
 * }
 * ```
 */
export async function getUser() {
	const supabase = await createSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
}

/**
 * Check if a session exists and redirect to a specified path if it does.
 * Use this in auth layouts to prevent authenticated users from accessing auth pages.
 *
 * @param redirectTo - The path to redirect to if session exists (default: '/dashboard')
 *
 * @example
 * ```typescript
 * // In auth layout
 * export default async function AuthLayout({ children }) {
 *   await sessionExists();
 *   return <>{children}</>;
 * }
 * ```
 */
export async function sessionExists(redirectTo = "/dashboard"): Promise<void> {
	const supabase = await createSupabaseClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		redirect(redirectTo);
	}
}

/**
 * Protect a route by requiring authentication.
 * Redirects to sign-in if no authenticated user is found.
 *
 * @param redirectTo - The path to redirect to if not authenticated (default: '/auth/sign-in')
 *
 * @example
 * ```typescript
 * // In a protected page or layout
 * export default async function DashboardPage() {
 *   await protectRoute();
 *   // ... rest of the component
 * }
 * ```
 */
export async function protectRoute(
	redirectTo = "/auth/sign-in",
): Promise<void> {
	const supabase = await createSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect(redirectTo);
	}
}
