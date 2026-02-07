import { DEFAULT_REDIRECT_PATH, validateRedirectPath } from "@repo/shared";
import { createRouteHandlerClient } from "@repo/ui/lib/supabase/server-client";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Auth callback endpoint for Supabase PKCE flow
 *
 * This route handles the OAuth/Email callback from Supabase.
 * It exchanges the authorization code for a session and sets cookies.
 *
 * Flow:
 * 1. User clicks email link → Supabase verifies token
 * 2. Supabase redirects to this callback with ?code=xxx
 * 3. This route exchanges code for session (sets HTTP-only cookies)
 * 4. User is redirected to the 'next' page (e.g., /auth/set-password)
 */
export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);

	// The 'code' is the authorization code from Supabase
	const code = searchParams.get("code");
	// The 'next' param tells us where to redirect after auth
	// Use validateRedirectPath to prevent open redirect vulnerabilities
	const next = validateRedirectPath(
		searchParams.get("next") ?? DEFAULT_REDIRECT_PATH,
	);

	if (code) {
		const cookieStore = await cookies();
		const supabase = createRouteHandlerClient(cookieStore);

		// Exchange the code for a session
		// This creates the HTTP-only cookies automatically
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// console.log(`✓ Auth callback successful, redirecting to: ${next}`);

			// Handle load balancer scenarios
			const forwardedHost = request.headers.get("x-forwarded-host");
			const isLocalEnv = process.env.NODE_ENV === "development";

			if (isLocalEnv) {
				// In development, no load balancer in between
				return NextResponse.redirect(`${origin}${next}`);
			} else if (forwardedHost) {
				// Behind a load balancer, use the forwarded host
				return NextResponse.redirect(`https://${forwardedHost}${next}`);
			} else {
				return NextResponse.redirect(`${origin}${next}`);
			}
		}

		console.error("Auth callback error:", error.message);

		// Redirect to sign-in with specific error
		const errorUrl = new URL("/login", origin);
		errorUrl.searchParams.set("error", "auth_code_error");
		errorUrl.searchParams.set(
			"message",
			`Authentication failed: ${error.message}`,
		);
		return NextResponse.redirect(errorUrl);
	}

	// No code provided - failure
	const errorUrl = new URL("/login", origin);
	errorUrl.searchParams.set("error", "auth_code_error");
	errorUrl.searchParams.set(
		"message",
		"Authentication failed. The link may have expired. Please request a new invitation.",
	);
	return NextResponse.redirect(errorUrl);
}
