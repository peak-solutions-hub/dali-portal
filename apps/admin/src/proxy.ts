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
 * Simplified approach: check session, redirect if needed
 */
export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

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

	// Get user session
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Allow public routes
	if (publicRoutes.some((route) => pathname.startsWith(route))) {
		// If authenticated and trying to access sign-in/forgot-password, redirect to dashboard
		if (
			user &&
			(pathname === "/auth/sign-in" || pathname === "/auth/forgot-password")
		) {
			const url = request.nextUrl.clone();
			url.pathname = "/dashboard";
			return NextResponse.redirect(url);
		}
		return response;
	}

	// Protected routes - require authentication
	if (!user) {
		const url = request.nextUrl.clone();
		url.pathname = "/auth/sign-in";
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
