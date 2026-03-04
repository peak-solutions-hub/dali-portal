import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/** How many seconds before expiry we proactively refresh the token. */
const REFRESH_THRESHOLD_SECONDS = 60;

/**
 * Updates the user's auth session securely using Supabase's SSR utilities.
 * Also handles custom routing logic via a callback, automatically copying
 * over updated session cookies if the response is modified (e.g., redirect).
 */
export async function updateSession(
	request: NextRequest,
	routingLogic?: (
		user: User | null,
		accessToken: string | null,
	) => Promise<NextResponse | undefined> | NextResponse | undefined,
) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			"Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file",
		);
	}

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				// Update incoming request cookies
				cookiesToSet.forEach(({ name, value }) =>
					request.cookies.set(name, value),
				);
				supabaseResponse = NextResponse.next({
					request,
				});
				// Ensure updated cookies are passed to the actual response headers
				cookiesToSet.forEach(({ name, value, options }) =>
					supabaseResponse.cookies.set(name, value, options),
				);
			},
		},
	});

	// Step 1: Read the session from cookies. This is a pure local operation — no
	// network call. It deserializes the cookie value and decodes the JWT locally.
	const {
		data: { session: localSession },
	} = await supabase.auth.getSession();

	if (!localSession) {
		// No session in cookies at all — unauthenticated request.
		// Skip the Supabase Auth API entirely.
		return await applyRoutingLogic(routingLogic, null, null, supabaseResponse);
	}

	const nowSeconds = Math.floor(Date.now() / 1000);
	const secondsUntilExpiry = (localSession.expires_at ?? 0) - nowSeconds;
	const tokenStillFresh = secondsUntilExpiry > REFRESH_THRESHOLD_SECONDS;

	if (tokenStillFresh) {
		// Step 2: Token is valid and not near expiry — use cookie data directly.
		// No GET /auth/v1/user call needed. This is the hot path for every normal
		// page navigation after login.
		return await applyRoutingLogic(
			routingLogic,
			localSession.user,
			localSession.access_token,
			supabaseResponse,
		);
	}

	// Step 3: Token is expiring within the threshold. Call getUser() which triggers
	// an automatic silent refresh and updates the session cookies via setAll().
	// This typically fires once per hour per user session.
	const {
		data: { user: refreshedUser },
	} = await supabase.auth.getUser();

	// After the refresh, read the updated token from the now-refreshed session.
	const {
		data: { session: freshSession },
	} = await supabase.auth.getSession();

	return await applyRoutingLogic(
		routingLogic,
		refreshedUser,
		freshSession?.access_token ?? null,
		supabaseResponse,
	);
}

/**
 * Runs the caller's routing logic and merges any refreshed session cookies onto
 * the redirect response. Returns the (possibly redirected) NextResponse.
 */
async function applyRoutingLogic(
	routingLogic:
		| ((
				user: User | null,
				accessToken: string | null,
		  ) => Promise<NextResponse | undefined> | NextResponse | undefined)
		| undefined,
	user: User | null,
	accessToken: string | null,
	supabaseResponse: NextResponse,
): Promise<NextResponse> {
	if (!routingLogic) {
		return supabaseResponse;
	}

	const redirectResponse = await routingLogic(user, accessToken);

	if (!redirectResponse) {
		return supabaseResponse;
	}

	// If routing logic produced a redirect, copy all refreshed session cookies
	// onto it so the browser receives the updated tokens.
	supabaseResponse.cookies.getAll().forEach((cookie) => {
		redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
	});

	return redirectResponse;
}
