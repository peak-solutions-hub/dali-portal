import { type BrowserContext, expect, test } from "@playwright/test";
import { authenticateViaSupabase } from "./auth.js";

const DEFAULT_APP_ORIGIN = process.env.ADMIN_URL ?? "http://127.0.0.1:3001";

export function getRequiredEnv(name: string): string | undefined {
	const value = process.env[name];
	if (!value || value.trim().length === 0) {
		return undefined;
	}
	return value;
}

export async function authenticateContextWithCredentials(
	context: BrowserContext,
	email: string,
	password: string,
	appOrigin = DEFAULT_APP_ORIGIN,
) {
	const state = await authenticateViaSupabase({
		supabaseUrl: getRequiredEnv("SUPABASE_URL") as string,
		supabaseKey: getRequiredEnv("SUPABASE_ANON_KEY") as string,
		appOrigin,
		email,
		password,
	});

	await context.addCookies(state.cookies);
	for (const originState of state.origins) {
		for (const entry of originState.localStorage) {
			await context.addInitScript(
				({ origin, key, value }) => {
					if (window.location.origin === origin) {
						window.localStorage.setItem(key, value);
					}
				},
				{
					origin: originState.origin,
					key: entry.name,
					value: entry.value,
				},
			);
		}
	}
}

export async function getAccessTokenForCredentials(
	email: string,
	password: string,
	appOrigin = DEFAULT_APP_ORIGIN,
): Promise<string> {
	const state = await authenticateViaSupabase({
		supabaseUrl: getRequiredEnv("SUPABASE_URL") as string,
		supabaseKey: getRequiredEnv("SUPABASE_ANON_KEY") as string,
		appOrigin,
		email,
		password,
	});

	const authTokenEntry = state.origins
		.flatMap((origin) => origin.localStorage)
		.find((entry) => entry.name.includes("auth-token"));

	expect(
		authTokenEntry,
		"Missing Supabase auth token in storage state",
	).toBeTruthy();

	const tokenValue = JSON.parse(
		(authTokenEntry as { value: string }).value,
	) as { access_token?: string };

	expect(
		tokenValue.access_token,
		"Missing access_token in storage state",
	).toBeTruthy();

	return tokenValue.access_token as string;
}

export function hasItAdminCredentials(): boolean {
	return Boolean(
		getRequiredEnv("E2E_IT_ADMIN_EMAIL") &&
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") &&
			getRequiredEnv("SUPABASE_URL") &&
			getRequiredEnv("SUPABASE_ANON_KEY"),
	);
}

export function hasNonAdminCredentials(): boolean {
	return Boolean(
		getRequiredEnv("E2E_NON_ADMIN_EMAIL") &&
			getRequiredEnv("E2E_NON_ADMIN_PASSWORD") &&
			getRequiredEnv("SUPABASE_URL") &&
			getRequiredEnv("SUPABASE_ANON_KEY"),
	);
}

export function hasDeactivatedCredentials(): boolean {
	return Boolean(
		getRequiredEnv("E2E_DEACTIVATED_EMAIL") &&
			getRequiredEnv("E2E_DEACTIVATED_PASSWORD") &&
			getRequiredEnv("SUPABASE_URL") &&
			getRequiredEnv("SUPABASE_ANON_KEY"),
	);
}

export async function signInAsItAdmin(context: BrowserContext) {
	const email = getRequiredEnv("E2E_IT_ADMIN_EMAIL");
	const password = getRequiredEnv("E2E_IT_ADMIN_PASSWORD");

	expect(email, "Missing E2E_IT_ADMIN_EMAIL").toBeTruthy();
	expect(password, "Missing E2E_IT_ADMIN_PASSWORD").toBeTruthy();

	await authenticateContextWithCredentials(
		context,
		email as string,
		password as string,
	);
}

export async function signInAsNonAdmin(context: BrowserContext) {
	const email = getRequiredEnv("E2E_NON_ADMIN_EMAIL");
	const password = getRequiredEnv("E2E_NON_ADMIN_PASSWORD");

	expect(email, "Missing E2E_NON_ADMIN_EMAIL").toBeTruthy();
	expect(password, "Missing E2E_NON_ADMIN_PASSWORD").toBeTruthy();

	await authenticateContextWithCredentials(
		context,
		email as string,
		password as string,
	);
}

export async function signInAsDeactivatedUser(context: BrowserContext) {
	const email = getRequiredEnv("E2E_DEACTIVATED_EMAIL");
	const password = getRequiredEnv("E2E_DEACTIVATED_PASSWORD");

	expect(email, "Missing E2E_DEACTIVATED_EMAIL").toBeTruthy();
	expect(password, "Missing E2E_DEACTIVATED_PASSWORD").toBeTruthy();

	await authenticateContextWithCredentials(
		context,
		email as string,
		password as string,
	);
}

export function skipIfMissingItAdminCredentials() {
	test.skip(
		!hasItAdminCredentials(),
		"Missing IT admin E2E auth env vars (E2E_IT_ADMIN_EMAIL, E2E_IT_ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY).",
	);
}

export function skipIfMissingNonAdminCredentials() {
	test.skip(
		!hasNonAdminCredentials(),
		"Missing non-admin E2E auth env vars (E2E_NON_ADMIN_EMAIL, E2E_NON_ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY).",
	);
}

export function skipIfMissingDeactivatedCredentials() {
	test.skip(
		!hasDeactivatedCredentials(),
		"Missing deactivated E2E auth env vars (E2E_DEACTIVATED_EMAIL, E2E_DEACTIVATED_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY).",
	);
}
