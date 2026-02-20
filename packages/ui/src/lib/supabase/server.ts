import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase server client for server-side operations
 * Uses service role key for admin operations (like generating signed URLs)
 *
 * @example
 * ```typescript
 * // In a Next.js server component or API route
 * const supabase = createSupabaseServerClient();
 * const url = await supabase.storage.from('bucket').createSignedUrl('path', 3600);
 * ```
 */
export function createSupabaseServerClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please set it in your app's .env.local file",
		);
	}

	if (!supabaseServiceKey) {
		throw new Error(
			"Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please set it in your app's .env.local file. " +
				"This key is required for server-side operations like generating signed URLs.",
		);
	}

	return createClient(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

/**
 * Create a Supabase server client using the anon key
 * Suitable for operations that don't require admin privileges
 *
 * @example
 * ```typescript
 * const supabase = createSupabaseAnonServerClient();
 * ```
 */
export function createSupabaseAnonServerClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error(
			"Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your app's .env.local file",
		);
	}

	return createClient(supabaseUrl, supabaseKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

/**
 * Supabase Server Clients
 *
 * Server-side Supabase client factories for Next.js.
 *
 * IMPORTANT: Import directly from this file, not through barrel exports.
 *
 * @example Route Handler
 * ```typescript
 * import { cookies } from 'next/headers';
 * import { createRouteHandlerClient } from '@repo/ui/lib/supabase/server';
 *
 * const cookieStore = await cookies();
 * const supabase = createRouteHandlerClient(cookieStore);
 * ```
 */

import {
	type CookieOptions,
	createServerClient as createSupabaseSSRServerClient,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get Supabase environment variables (anon key)
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
 * Create a Supabase server client for Route Handlers (Server Actions).
 *
 * Use this in API routes or Server Actions where you can write cookies.
 */
export function createRouteHandlerClient(cookieStore: {
	getAll: () => { name: string; value: string }[];
	set: (name: string, value: string, options?: CookieOptions) => void;
}): SupabaseClient {
	const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

	return createSupabaseSSRServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(
				cookiesToSet: {
					name: string;
					value: string;
					options: CookieOptions;
				}[],
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
