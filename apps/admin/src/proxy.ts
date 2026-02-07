import {
	DEFAULT_REDIRECT_PATH,
	isAuthOnlyRoute,
	isPublicRoute,
} from "@repo/shared";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
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
					cookiesToSet.forEach(({ name, value }) => {
						request.cookies.set(name, value);
					});
					response = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) => {
						response.cookies.set(name, value, options);
					});
				},
			},
		},
	);

	// Refresh session if expired - this will automatically refresh the session token
	// Per Supabase SSR docs: getSession() triggers automatic token refresh
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const pathname = request.nextUrl.pathname;

	// If no session and not on a public route, redirect to login
	if (!session && !isPublicRoute(pathname)) {
		const redirectUrl = new URL("/login", request.url);
		redirectUrl.searchParams.set(
			"message",
			"Please sign in to access this page.",
		);
		redirectUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(redirectUrl);
	}

	// If has session and on an auth-only route (login, etc.), redirect to dashboard
	if (session && isAuthOnlyRoute(pathname)) {
		return NextResponse.redirect(new URL(DEFAULT_REDIRECT_PATH, request.url));
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
