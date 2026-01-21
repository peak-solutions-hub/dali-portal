"use client";

import { ROLE_PERMISSIONS, type RoleType } from "@repo/shared";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores";

/**
 * Route to feature mapping for role-based access control
 */
const ROUTE_FEATURE_MAP: Record<string, keyof typeof ROLE_PERMISSIONS> = {
	"/dashboard": "DASHBOARD",
	"/document-tracker": "DOCUMENT_TRACKER",
	"/caller-slips": "CALLER_SLIPS",
	"/session-management": "SESSION_MANAGEMENT",
	"/inquiry-tickets": "INQUIRY_TICKETS",
	"/visitor-and-beneficiary-hub": "VISITOR_BENEFICIARY_HUB",
	"/conference-room": "CONFERENCE_ROOM",
	"/user-management": "USER_MANAGEMENT",
};

/**
 * Check if a user has permission to access a route
 */
function hasRoutePermission(
	pathname: string,
	userRole: RoleType | undefined,
): boolean {
	if (!userRole) return false;

	// Find matching route (check if pathname starts with any protected route)
	const matchedRoute = Object.keys(ROUTE_FEATURE_MAP).find((route) =>
		pathname.startsWith(route),
	);

	if (!matchedRoute) return true; // Allow access to non-protected routes

	const feature = ROUTE_FEATURE_MAP[matchedRoute];
	if (!feature) return true; // No feature mapping, allow access

	return ROLE_PERMISSIONS[feature].includes(userRole);
}

/**
 * Hook to protect routes based on user role
 * Redirects to /unauthorized if user doesn't have permission
 *
 * NOTE: This hook should only be used on protected pages/components.
 * Auth pages handle their own routing logic.
 */
export function useRoleProtection() {
	const router = useRouter();
	const pathname = usePathname();
	const { userProfile, isLoading, isAuthenticated } = useAuthStore();

	useEffect(() => {
		// Skip protection for auth routes and unauthorized page
		// These routes handle their own logic
		if (pathname.startsWith("/auth") || pathname === "/unauthorized") {
			return;
		}

		// Wait for auth state to be determined
		if (isLoading) {
			return;
		}

		// Redirect to sign-in if not authenticated
		// The proxy middleware should handle this, but this is a fallback
		if (!isAuthenticated) {
			router.push(`/auth/sign-in?redirect=${encodeURIComponent(pathname)}`);
			return;
		}

		// Check role permission
		const hasPermission = hasRoutePermission(pathname, userProfile?.role?.name);

		if (!hasPermission) {
			// Redirect to unauthorized page (401)
			router.push("/unauthorized");
		}
	}, [pathname, userProfile, isLoading, isAuthenticated, router]);

	return {
		isLoading,
		hasPermission: hasRoutePermission(pathname, userProfile?.role?.name),
	};
}
