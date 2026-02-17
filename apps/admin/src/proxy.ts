import {
	DEFAULT_REDIRECT_PATH,
	getRedirectPath,
	isAuthOnlyRoute,
	isPublicRoute,
	type RoleType,
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

	// Use getUser() instead of getSession() to validate the JWT with Supabase servers
	// getSession() only reads from cookies without validation (triggers a security warning)
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const pathname = request.nextUrl.pathname;

	// If no user and not on a public route, redirect to login
	if (!user && !isPublicRoute(pathname)) {
		const redirectUrl = new URL("/login", request.url);
		redirectUrl.searchParams.set(
			"message",
			"Please sign in to access this page.",
		);
		redirectUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(redirectUrl);
	}

	// If authenticated and on an auth-only route (login, etc.) or root, redirect based on role
	if (user && (isAuthOnlyRoute(pathname) || pathname === "/")) {
		let redirectPath: string = DEFAULT_REDIRECT_PATH;

		try {
			const { data: sessionData } = await supabase.auth.getSession();
			const accessToken = sessionData?.session?.access_token;

			if (!accessToken) {
				console.error(
					"No access token available for backend request — cannot determine role for redirect",
				);
			} else {
				const apiBase =
					process.env.NEXT_PUBLIC_API_URL ?? new URL("/", request.url).origin;
				try {
					const res = await fetch(new URL("/users/me", apiBase).toString(), {
						headers: { Authorization: `Bearer ${accessToken}` },
						cache: "no-store",
					});

					if (res.ok) {
						const profile = await res.json();
						if (profile?.role?.name) {
							redirectPath = getRedirectPath(profile.role.name as RoleType);
						} else {
							console.error("Backend returned profile without role:", profile);
						}
					} else {
						const text = await res.text();
						console.error(
							"Backend /users/me returned non-OK status:",
							res.status,
							text,
						);
					}
				} catch (err) {
					console.error("Error calling backend /users/me for redirect:", err);
				}
			}
		} catch (error) {
			console.error("Unexpected error determining redirect:", error);
		}

		return NextResponse.redirect(new URL(redirectPath, request.url));
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
