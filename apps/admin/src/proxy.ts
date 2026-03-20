import {
	DEFAULT_REDIRECT_PATH,
	getRedirectPath,
	isAuthOnlyRoute,
	isPublicRoute,
	type RoleType,
} from "@repo/shared";
import { updateSession } from "@repo/ui/lib/supabase/proxy";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	return await updateSession(request, async (user, accessToken) => {
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
								console.error(
									"Backend returned profile without role:",
									profile,
								);
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

		return undefined;
	});
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
