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
