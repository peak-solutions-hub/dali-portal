"use client";

import { type RoleType } from "@repo/shared";
import { createBrowserClient } from "@repo/ui/lib/supabase/client";
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
	/** Whether the user is authenticated */
	isAuthenticated: boolean;
}

/**
 * Auth store actions interface
 */
interface AuthActions {
	/** Set the Supabase session and update auth token for API calls */
	setSession: (session: Session | null) => void;
	/** Fetch user profile from NestJS backend */
	fetchProfile: () => Promise<{
		profile: UserProfile | null;
		errorCode?: string;
	}>;
	/** Clear auth state and sign out from Supabase */
	logout: () => Promise<void>;
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
	isAuthenticated: false,

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
			set({ userProfile: null });
			return { profile: null };
		}

		const [error, data] = await api.users.me({});

		if (error) {
			const errCode = (error as { code?: string })?.code;

			set({ userProfile: null });
			return { profile: null, errorCode: errCode };
		}

		set({ userProfile: data });
		return { profile: data, errorCode: undefined };
	},

	logout: async () => {
		const supabase = createBrowserClient();
		await supabase.auth.signOut();

		// Clear the auth token
		setAuthToken(null);

		set({
			session: null,
			userProfile: null,
			isAuthenticated: false,
		});
	},
}));
