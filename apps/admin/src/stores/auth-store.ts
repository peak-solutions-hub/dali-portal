"use client";

import { type RoleType } from "@repo/shared";
import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { api, setAuthToken } from "@/lib/api.client";

/**
 * User profile type as returned from the API (JSON serialized)
 * Dates are serialized as strings when transmitted over HTTP
 */
export interface UserProfile {
	id: string;
	roleId: string;
	fullName: string;
	email: string;
	createdAt: string;
	status: "active" | "invited" | "deactivated";
	role: {
		id: string;
		name: RoleType;
		createdAt: string;
	};
}

/**
 * Auth store state interface
 */
interface AuthState {
	/** Supabase session containing the JWT token */
	session: Session | null;
	/** User profile from public.users table with role information */
	userProfile: UserProfile | null;
	/** Loading state for initial auth check */
	isLoading: boolean;
	/** Whether the user is authenticated */
	isAuthenticated: boolean;
	/** Error message if authentication fails */
	error: string | null;
}

/**
 * Auth store actions interface
 */
interface AuthActions {
	/** Set the Supabase session and update auth token for API calls */
	setSession: (session: Session | null) => void;
	/** Fetch user profile from NestJS backend */
	fetchProfile: () => Promise<void>;
	/** Clear auth state and sign out from Supabase */
	logout: () => Promise<void>;
	/** Set loading state */
	setLoading: (isLoading: boolean) => void;
	/** Set error state */
	setError: (error: string | null) => void;
	/** Initialize auth state from Supabase */
	initialize: () => Promise<void>;
}

/**
 * Combined auth store type
 */
type AuthStore = AuthState & AuthActions;

/**
 * Zustand auth store for managing authentication state
 *
 * @example
 * ```tsx
 * const { session, userProfile, isAuthenticated, logout } = useAuthStore();
 *
 * if (!isAuthenticated) {
 *   return <LoginPage />;
 * }
 *
 * return <Dashboard user={userProfile} />;
 * ```
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
	// Initial state
	session: null,
	userProfile: null,
	isLoading: true,
	isAuthenticated: false,
	error: null,

	// Actions
	setSession: (session) => {
		// Update the API client auth token
		if (session?.access_token) {
			setAuthToken(session.access_token);
		} else {
			setAuthToken(null);
		}

		set({
			session,
			isAuthenticated: !!session,
			// Clear profile if session is cleared
			userProfile: session ? get().userProfile : null,
		});
	},

	fetchProfile: async () => {
		const { session } = get();

		if (!session) {
			set({ userProfile: null, error: "No session available" });
			return;
		}

		try {
			set({ error: null });

			const [error, data] = await api.users.me({});

			if (error) {
				console.error("Failed to fetch user profile:", error);
				set({
					userProfile: null,
					error: "Failed to fetch user profile",
				});
				return;
			}

			set({ userProfile: data });
		} catch (err) {
			console.error("Error fetching profile:", err);
			set({
				userProfile: null,
				error: "An unexpected error occurred",
			});
		}
	},

	logout: async () => {
		try {
			const supabase = createBrowserClient();
			await supabase.auth.signOut();

			// Clear the auth token
			setAuthToken(null);

			set({
				session: null,
				userProfile: null,
				isAuthenticated: false,
				error: null,
			});
		} catch (err) {
			console.error("Error during logout:", err);
			// Still clear local state even if Supabase signout fails
			setAuthToken(null);
			set({
				session: null,
				userProfile: null,
				isAuthenticated: false,
				error: "Logout failed, but local session cleared",
			});
		}
	},

	setLoading: (isLoading) => set({ isLoading }),

	setError: (error) => set({ error }),

	initialize: async () => {
		try {
			set({ isLoading: true, error: null });

			const supabase = createBrowserClient();
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();

			if (error) {
				console.error("Error getting session:", error);
				set({
					session: null,
					userProfile: null,
					isAuthenticated: false,
					isLoading: false,
					error: error.message,
				});
				return;
			}

			if (session) {
				get().setSession(session);
				await get().fetchProfile();
			}

			set({ isLoading: false });
		} catch (err) {
			console.error("Error initializing auth:", err);
			set({
				isLoading: false,
				error: "Failed to initialize authentication",
			});
		}
	},
}));
