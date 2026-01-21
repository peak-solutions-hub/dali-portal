import {
	AUTH_CALLBACK_ROUTES,
	PASSWORD_SETUP_ROUTES,
	PROTECTED_ROUTES,
	PUBLIC_AUTH_ROUTES,
} from "@repo/shared";
import { createMiddlewareClient } from "@repo/ui/lib/supabase/server-client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js 16 proxy function for authentication and route protection
 * Handles session management and redirects based on authentication status
 */
export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Allow auth callback/confirm endpoints to process without interference
	const isAuthCallback = AUTH_CALLBACK_ROUTES.some((route) =>
		pathname.startsWith(route),
	);
	if (isAuthCallback) {
		return NextResponse.next({ request });
	}

	// Create response that will be modified by Supabase if needed
	let response = NextResponse.next({ request });

	// Use @supabase/ssr for proper session management
	const { user } = await createMiddlewareClient({
		getCookies: () => request.cookies.getAll(),
		onSetCookies: (cookiesToSet) => {
			// Update request cookies
			for (const { name, value } of cookiesToSet) {
				request.cookies.set(name, value);
			}
			// Create new response with updated request
			response = NextResponse.next({ request });
			// Set cookies on response
			for (const { name, value, options } of cookiesToSet) {
				response.cookies.set(name, value, options);
			}
		},
	});

	// Check if current route is protected
	const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
		pathname.startsWith(route),
	);
	const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) =>
		pathname.startsWith(route),
	);
	const isPasswordSetupRoute = PASSWORD_SETUP_ROUTES.some((route) =>
		pathname.startsWith(route),
	);

	// Redirect to sign-in if accessing protected route without session
	if (isProtectedRoute && !user) {
		const signInUrl = new URL("/auth/sign-in", request.url);
		signInUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(signInUrl);
	}

	// Allow password setup routes
	if (isPasswordSetupRoute) {
		return response;
	}

	// Redirect authenticated users away from public auth pages to dashboard
	if (isPublicAuthRoute && user) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except static files and images
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
