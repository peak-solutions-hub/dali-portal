import { createRouteHandlerClient } from "@repo/ui/lib/supabase/server-client";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Auth confirmation endpoint for email verification links
 * Handles magic links, password resets, email confirmations, and user invitations
 *
 * Supabase email links redirect here with token_hash and type parameters
 *
 * Flow:
 * - Invite email (type=invite) → /auth/set-password (new user sets password)
 * - Forgot password email (type=recovery) → /auth/set-password (user resets password)
 * - Signup confirmation (type=signup) → /auth/set-password
 * - Other types → /dashboard
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;

	// Default redirect based on type
	let next = searchParams.get("next");

	if (!next) {
		// Default redirects for different email types
		if (type === "invite" || type === "signup" || type === "recovery") {
			// All password-related flows go to /auth/set-password
			// The page works for both invites and password resets
			next = "/auth/set-password";
		} else {
			next = "/dashboard";
		}
	}

	const redirectTo = request.nextUrl.clone();
	redirectTo.pathname = next;
	redirectTo.searchParams.delete("token_hash");
	redirectTo.searchParams.delete("type");
	redirectTo.searchParams.delete("next");

	if (token_hash && type) {
		const cookieStore = await cookies();
		const supabase = createRouteHandlerClient(cookieStore);

		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		});

		if (!error) {
			// Successful verification - redirect to the appropriate page
			console.log(
				`✓ Email verification successful: type=${type}, redirect=${next}`,
			);
			return NextResponse.redirect(redirectTo);
		}

		console.error("OTP verification error:", error);
	}

	// Return the user to sign-in with an error message
	const errorUrl = request.nextUrl.clone();
	errorUrl.pathname = "/auth/sign-in";
	errorUrl.searchParams.set("error", "invalid_link");
	errorUrl.searchParams.set(
		"message",
		"The verification link is invalid or has expired. Please request a new one.",
	);
	return NextResponse.redirect(errorUrl);
}
