"use client";

import {
	AUTH_DEBOUNCE,
	DEACTIVATED_MESSAGE,
	getRedirectPath,
	PROFILE_CACHE,
} from "@repo/shared";
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
import { toast } from "sonner";
import { api, setAuthToken } from "@/lib/api.client";
import type { UserProfile } from "@/stores/auth-store";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Discriminated union returned by fetchProfile.
 * Callers decide what UI action to take based on the status.
 */
export type FetchProfileResult =
	| { status: "ok"; profile: UserProfile }
	| { status: "deactivated" }
	| { status: "error"; message?: string };

type AuthContextType = {
	user: User | null;
	session: Session | null;
	userProfile: UserProfile | null;
	isLoading: boolean;
	signOut: () => Promise<void>;
	/** Fetch user profile — returns a discriminated result, never throws */
	fetchProfile: (
		accessToken: string,
		userEmail?: string,
	) => Promise<FetchProfileResult>;
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
	 * Pure profile fetcher — calls /users/me, detects deactivated accounts,
	 * signs out on failure. Does NOT show toasts or redirect.
	 * Callers (onAuthStateChange handlers, set-password-form) own UI actions.
	 */
	const fetchProfile = async (
		accessToken: string,
		userEmail?: string,
	): Promise<FetchProfileResult> => {
		// Check cache first
		if (profileCacheRef.current) {
			const { token, profile, timestamp } = profileCacheRef.current;
			if (
				token === accessToken &&
				Date.now() - timestamp < PROFILE_CACHE.TTL_MS
			) {
				setUserProfile(profile);
				useAuthStore.setState({ userProfile: profile });
				setIsLoading(false);
				return { status: "ok", profile };
			}
		}

		// Ensure token is set before making API call
		setAuthToken(accessToken);

		try {
			const [error, data] = await api.users.me({});

			if (error) {
				const errCode = (error as { code?: string })?.code;
				let isDeactivated =
					errCode === "AUTH.DEACTIVATED_ACCOUNT" ||
					errCode === "DEACTIVATED_ACCOUNT";

				// Fallback: ORPCError from NestJS guard arrives as INTERNAL_SERVER_ERROR
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

				// Sign out — caller will handle UI
				await supabase.auth.signOut();
				setAuthToken(null);
				setUserProfile(null);
				useAuthStore.setState({ userProfile: null });
				setIsLoading(false);

				if (isDeactivated) {
					return { status: "deactivated" };
				}
				return { status: "error" };
			}

			// Cache the profile
			if (data) {
				profileCacheRef.current = {
					token: accessToken,
					profile: data,
					timestamp: Date.now(),
				};
			}

			setUserProfile(data);
			useAuthStore.setState({ userProfile: data });
			setIsLoading(false);
			return { status: "ok", profile: data };
		} catch (_error) {
			setUserProfile(null);
			useAuthStore.setState({ userProfile: null });
			setIsLoading(false);
			return { status: "error" };
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

				setSession(session);
				setUser(session?.user ?? null);

				// Update Zustand store to keep in sync
				useAuthStore.getState().setSession(session);

				if (event === "INITIAL_SESSION") {
					hasInitialized = true;

					if (session?.access_token) {
						const result = await fetchProfile(
							session.access_token,
							session.user?.email,
						);

						if (result.status === "deactivated") {
							toast.error(DEACTIVATED_MESSAGE);
						} else if (result.status === "error") {
							// Silent — proxy.ts will handle the redirect for protected pages
						}
					} else {
						setUserProfile(null);
						setIsLoading(false);
					}
				} else if (event === "SIGNED_IN" && hasInitialized) {
					// User explicitly signed in — own the success/error flow
					if (session?.access_token) {
						const path = window.location.pathname;
						const isAuthPage =
							path === "/" ||
							path === "/login" ||
							path === "/forgot-password" ||
							path === "/set-password" ||
							path.startsWith("/auth/");

						// Only show global loading for real login flows from auth pages.
						// Supabase may emit SIGNED_IN while already authenticated (e.g. tab focus/session recovery).
						if (isAuthPage) {
							setIsLoading(true);
						}

						const result = await fetchProfile(
							session.access_token,
							session.user?.email,
						);

						if (result.status === "ok") {
							// IMPORTANT: Supabase can emit SIGNED_IN more than once.
							// Only redirect/show login success when user is on auth routes.
							if (isAuthPage) {
								const redirectPath = getRedirectPath(result.profile.role.name);
								if (path !== redirectPath) {
									router.push(redirectPath);
								}
								toast.success("Login successful");
							}
						} else if (result.status === "deactivated") {
							toast.error(DEACTIVATED_MESSAGE);
							// No redirect — user is already on /login or /set-password
						} else {
							toast.error("An error occurred. Please try again.");
						}
					}
				}

				// TOKEN_REFRESHED: just update the token, no profile fetch needed
				if (event === "TOKEN_REFRESHED" && session?.access_token) {
					setAuthToken(session.access_token);
					setIsLoading(false);
				}

				// SIGNED_OUT: user signed out or session expired
				if (event === "SIGNED_OUT") {
					setUserProfile(null);
					useAuthStore.setState({ userProfile: null });
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
						toast.info("Your session has expired. Please sign in again.");
						router.push("/login");
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
	}, [router, supabase]);

	const signOut = async () => {
		await supabase.auth.signOut();
		setAuthToken(null);
		setUserProfile(null);
		useAuthStore.setState({ userProfile: null });
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
