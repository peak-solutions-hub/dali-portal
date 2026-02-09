/**
 * Supabase Browser Client
 *
 * Create a Supabase client for browser/client-side usage.
 * Uses @supabase/ssr for proper cookie handling and session management.
 *
 * IMPORTANT: Import directly from this file, not through barrel exports.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { createBrowserClient } from '@repo/ui/lib/supabase/client';
 *
 * const supabase = createBrowserClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Get Supabase environment variables
 * Throws an error if not configured
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

export function createBrowserClient(): SupabaseClient {
	if (browserClient) {
		return browserClient;
	}

	const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

	browserClient = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);

	return browserClient;
}
