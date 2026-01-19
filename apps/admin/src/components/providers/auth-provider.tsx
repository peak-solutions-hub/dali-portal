"use client";

import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface AuthProviderProps {
	children: React.ReactNode;
}

/**
 * AuthProvider component that manages Supabase authentication state.
 *
 * This provider:
 * 1. Initializes the auth state on mount
 * 2. Listens to Supabase auth state changes
 * 3. Updates the Zustand store when auth state changes
 * 4. Fetches user profile from NestJS backend when authenticated
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
	const { setSession, fetchProfile, setLoading, initialize } = useAuthStore();
	const initializedRef = useRef(false);

	useEffect(() => {
		// Prevent double initialization in React Strict Mode
		if (initializedRef.current) return;
		initializedRef.current = true;

		const supabase = createBrowserClient();

		// Initialize auth state
		initialize();

		// Listen to auth state changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("[AuthProvider] Auth state changed:", event);

			switch (event) {
				case "SIGNED_IN":
				case "TOKEN_REFRESHED":
					setSession(session);
					if (session) {
						await fetchProfile();
					}
					setLoading(false);
					break;

				case "SIGNED_OUT":
					setSession(null);
					setLoading(false);
					break;

				case "USER_UPDATED":
					// User profile was updated (e.g., password change)
					setSession(session);
					if (session) {
						await fetchProfile();
					}
					break;

				case "INITIAL_SESSION":
					// Initial session check completed
					// This is handled by initialize() above
					break;

				default:
					console.log("[AuthProvider] Unhandled auth event:", event);
			}
		});

		// Cleanup subscription on unmount
		return () => {
			subscription.unsubscribe();
		};
	}, [setSession, fetchProfile, setLoading, initialize]);

	return <>{children}</>;
}
