"use client";

import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "@/lib/api.client";
import type { UserProfile } from "@/stores/auth-store";

type AuthContextType = {
	user: User | null;
	session: Session | null;
	userProfile: UserProfile | null;
	isLoading: boolean;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	userProfile: null,
	isLoading: true,
	signOut: () => {
		throw new Error("AuthContext.signOut was called outside of AuthProvider");
	},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const supabase = createBrowserClient();

	// Fetch user profile from backend
	const fetchProfile = async (accessToken: string) => {
		setAuthToken(accessToken);

		const [error, data] = await api.users.me({});

		if (error) {
			console.error("Failed to fetch user profile:", error);
			setUserProfile(null);
			return;
		}

		setUserProfile(data);
	};

	useEffect(() => {
		// Listen to auth state changes for automatic token refresh
		// onAuthStateChange will fire INITIAL_SESSION event immediately with existing session
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("[AuthProvider] Auth event:", event, session?.user?.id);

			setSession(session);
			setUser(session?.user ?? null);

			// INITIAL_SESSION: fired on app load with existing session
			// SIGNED_IN: user just signed in
			// TOKEN_REFRESHED: access token was refreshed
			if (
				event === "INITIAL_SESSION" ||
				event === "SIGNED_IN" ||
				event === "TOKEN_REFRESHED"
			) {
				if (session?.access_token) {
					try {
						await fetchProfile(session.access_token);
					} catch (error) {
						console.error("[AuthProvider] Failed to fetch profile:", error);
						// Don't sign out on profile fetch error during INITIAL_SESSION
						// User might have network issues but session is valid
						if (event !== "INITIAL_SESSION") {
							setUserProfile(null);
						}
					}
				} else {
					console.log("[AuthProvider] No session found");
					setUserProfile(null);
				}
				setIsLoading(false);
			}

			// SIGNED_OUT: user signed out or session expired
			if (event === "SIGNED_OUT") {
				console.log("[AuthProvider] User signed out, clearing state");
				setUserProfile(null);
				setAuthToken(null);
				setIsLoading(false);

				// Only redirect if not already on auth pages
				if (!window.location.pathname.startsWith("/auth/")) {
					router.push(
						"/auth/sign-in?message=Your session has expired. Please sign in again.",
					);
				}
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [router, supabase]);

	const signOut = async () => {
		await supabase.auth.signOut();
		setAuthToken(null);
		setUserProfile(null);
		router.push("/auth/sign-in");
	};

	const value = {
		user,
		session,
		userProfile,
		isLoading,
		signOut,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
