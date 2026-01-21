import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
	"/auth/sign-in",
	"/auth/forgot-password",
	"/auth/confirm",
	"/auth/callback",
	"/auth/set-password",
	"/unauthorized",
];

/**
 * Next.js 16 proxy function for authentication routing
 * Handles automatic session refresh and authentication checks
 */
export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Allow auth callback routes to process without interference
	// These routes handle their own session establishment
	if (
		pathname.startsWith("/auth/callback") ||
		pathname.startsWith("/auth/confirm")
	) {
		return NextResponse.next({ request });
	}

	let response = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					// Set cookies on both request and response for proper propagation
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					response = NextResponse.next({
						request,
					});
					for (const { name, value, options } of cookiesToSet) {
						response.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	// Important: Use getUser() instead of getSession() for security
	// getUser() validates the JWT with Supabase servers
	// This also triggers automatic token refresh if needed
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	// Allow public routes
	if (publicRoutes.some((route) => pathname.startsWith(route))) {
		return response;
	}

	// Protected routes - require authentication
	if (!user || error) {
		console.log(
			`[Proxy] No valid user for ${pathname}, redirecting to sign-in`,
		);
		const url = request.nextUrl.clone();
		url.pathname = "/auth/sign-in";
		if (error) {
			url.searchParams.set(
				"message",
				"Your session has expired. Please sign in again.",
			);
		}
		return NextResponse.redirect(url);
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
