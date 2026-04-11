import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export interface SupabaseAuthOptions {
	supabaseUrl: string;
	supabaseKey: string;
	appOrigin: string;
	email: string;
	password: string;
}

export interface StorageState {
	cookies: Array<{
		name: string;
		value: string;
		domain: string;
		path: string;
	}>;
	origins: Array<{
		origin: string;
		localStorage: Array<{ name: string; value: string }>;
	}>;
}

/**
 * Authenticate against Supabase Auth and return a Playwright-compatible
 * storage state containing the session tokens as localStorage entries.
 */
export async function authenticateViaSupabase(
	options: SupabaseAuthOptions,
): Promise<StorageState> {
	const supabase = createClient(options.supabaseUrl, options.supabaseKey);

	const { data, error } = await supabase.auth.signInWithPassword({
		email: options.email,
		password: options.password,
	});

	if (error || !data.session) {
		throw new Error(
			`Supabase auth failed: ${error?.message ?? "No session returned"}`,
		);
	}

	const { access_token, refresh_token } = data.session;
	const origin = options.appOrigin;
	const supabaseProjectRef = new URL(options.supabaseUrl).hostname.split(
		".",
	)[0];

	return {
		cookies: [],
		origins: [
			{
				origin,
				localStorage: [
					{
						name: `sb-${supabaseProjectRef}-auth-token`,
						value: JSON.stringify({
							access_token,
							refresh_token,
							token_type: "bearer",
							expires_in: data.session.expires_in,
							expires_at: data.session.expires_at,
							user: data.session.user,
						}),
					},
				],
			},
		],
	};
}

/**
 * Save a Playwright storage state to a JSON file.
 * Creates the parent directory if it does not exist.
 */
export function saveStorageState(state: StorageState, filePath: string): void {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
}

/**
 * Load a previously saved Playwright storage state from a JSON file.
 */
export function loadStorageState(filePath: string): StorageState {
	const raw = fs.readFileSync(filePath, "utf-8");
	return JSON.parse(raw) as StorageState;
}
