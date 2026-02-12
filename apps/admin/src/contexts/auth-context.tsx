"use client";

import { AUTH_DEBOUNCE, PROFILE_CACHE } from "@repo/shared";
import { createBrowserClient } from "@repo/ui/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { api, setAuthToken } from "@/lib/api.client";
import type { UserProfile } from "@/stores/auth-store";
import { useAuthStore } from "@/stores/auth-store";

type AuthContextType = {
	user: User | null;
	session: Session | null;
	userProfile: UserProfile | null;
	isLoading: boolean;
	signOut: () => Promise<void>;
	/** Fetch user profile - returns the profile or null */
	fetchProfile: (
		accessToken: string,
		userEmail?: string,
	) => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	userProfile: null,
	isLoading: true,
	signOut: () => {
		throw new Error("AuthContext.signOut was called outside of AuthProvider");
	},
	fetchProfile: () => {
		throw new Error(
			"AuthContext.fetchProfile was called outside of AuthProvider",
		);
	},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	// Stabilize Supabase client to prevent dependency changes
	const [supabase] = useState(() => createBrowserClient());

	// Cache to prevent re-fetching during Fast Refresh
	const profileCacheRef = useRef<{
		token: string;
		profile: UserProfile;
		timestamp: number;
	} | null>(null);

	/**
	 * Fetch user profile from backend.
	 * Returns the profile directly for immediate use.
	 */
	const fetchProfile = async (
		accessToken: string,
		userEmail?: string,
	): Promise<UserProfile | null> => {
		// Check cache first
		if (profileCacheRef.current) {
			const { token, profile, timestamp } = profileCacheRef.current;
			if (
				token === accessToken &&
				Date.now() - timestamp < PROFILE_CACHE.TTL_MS
			) {
				// console.log("[AuthProvider] Using cached profile");
				setUserProfile(profile);
				setIsLoading(false);
				return profile;
			}
		}

		// console.log("[AuthProvider] Fetching profile from API");

		// Ensure token is set before making API call
		setAuthToken(accessToken);

		try {
			const [error, data] = await api.users.me({});

			if (error) {
				// Sign out and redirect on ANY error (401/403/500)
				const errCode = (error as { code?: string })?.code;
				let isDeactivated =
					errCode === "AUTH.DEACTIVATED_ACCOUNT" ||
					errCode === "DEACTIVATED_ACCOUNT";

				if (
					!isDeactivated &&
					errCode === "INTERNAL_SERVER_ERROR" &&
					userEmail
				) {
					const [checkError, checkResult] = await api.users.checkEmailStatus({
						email: userEmail,
					});

					if (!checkError && checkResult?.isDeactivated) {
						isDeactivated = true;
					}
				}

				await supabase.auth.signOut();
				setAuthToken(null);
				setUserProfile(null);
				setIsLoading(false);

				// Hard redirect based on error code
				if (isDeactivated) {
					window.location.href =
						"/login?error=deactivated_account&message=Your%20account%20has%20been%20deactivated.%20Please%20contact%20a%20system%20administrator.";
				} else {
					// Invalid token, expired session, 500 errors, etc. → login
					window.location.href = "/login";
				}
				return null;
			}

			// console.log("[AuthProvider] Profile fetched successfully:", data?.email);

			// Cache the profile
			if (data) {
				profileCacheRef.current = {
					token: accessToken,
					profile: data,
					timestamp: Date.now(),
				};
			}

			setUserProfile(data);
			setIsLoading(false);
			return data;
		} catch (_error) {
			// Catch any unexpected errors during API call
			setUserProfile(null);
			setIsLoading(false);
			return null;
		}
	};

	useEffect(() => {
		let isSubscribed = true;
		let debounceTimer: NodeJS.Timeout | null = null;
		let hasInitialized = false;

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (!isSubscribed) return;

			// Debounce rapid auth events
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}

			debounceTimer = setTimeout(async () => {
				if (!isSubscribed) return;
				// console.log("[AuthProvider] Auth event:", event, session?.user?.id);

				setSession(session);
				setUser(session?.user ?? null);

				// Update Zustand store as well to keep in sync
				useAuthStore.getState().setSession(session);

				// Prevent INITIAL_SESSION and SIGNED_IN conflicts:
				// Only fetch profile on INITIAL_SESSION (once) or SIGNED_IN (user login)
				// Skip profile fetch on SIGNED_IN if we already handled INITIAL_SESSION
				if (event === "INITIAL_SESSION") {
					hasInitialized = true;

					if (session?.access_token) {
						try {
							await fetchProfile(session.access_token, session.user?.email);
						} catch (_error) {
							setUserProfile(null);
							setIsLoading(false);
						}
					} else {
						// console.log("[AuthProvider] No session found");
						setUserProfile(null);
						setIsLoading(false);
					}
				} else if (event === "SIGNED_IN" && hasInitialized) {
					// User explicitly signed in after initialization - refetch profile
					if (session?.access_token) {
						try {
							await fetchProfile(session.access_token, session.user?.email);
						} catch (_error) {
							setUserProfile(null);
							setIsLoading(false);
						}
					}
				}

				// TOKEN_REFRESHED: just update the token, no profile fetch needed
				if (event === "TOKEN_REFRESHED" && session?.access_token) {
					// console.log("[AuthProvider] Token refreshed, updating auth token");
					setAuthToken(session.access_token);
					setIsLoading(false);
				}

				// SIGNED_OUT: user signed out or session expired
				if (event === "SIGNED_OUT") {
					// console.log("[AuthProvider] User signed out, clearing state");
					setUserProfile(null);
					setAuthToken(null);
					setIsLoading(false);
					profileCacheRef.current = null;

					// Only redirect if not already on auth pages
					const path = window.location.pathname;
					if (
						!path.startsWith("/auth/") &&
						path !== "/login" &&
						path !== "/forgot-password" &&
						path !== "/set-password"
					) {
						router.push(
							"/login?message=Your session has expired. Please sign in again.",
						);
					}
				}
			}, AUTH_DEBOUNCE.DELAY_MS);
		});

		return () => {
			isSubscribed = false;
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
			subscription.unsubscribe();
		};
		// Note: Only depend on router and supabase (now stable via useState)
		// Removed isInitialized to prevent premature unsubscription
	}, [router, supabase]);

	const signOut = async () => {
		await supabase.auth.signOut();
		setAuthToken(null);
		setUserProfile(null);
		profileCacheRef.current = null;
		router.push("/login");
	};

	const value = useMemo(
		() => ({
			user,
			session,
			userProfile,
			isLoading,
			signOut,
			fetchProfile,
		}),
		[user, session, userProfile, isLoading],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
