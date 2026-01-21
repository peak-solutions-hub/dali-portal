import {
	getRedirectPath,
	type LoginInput,
	type ResetPasswordInput,
	type SetPasswordInput,
} from "@repo/shared";
import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import type { Session } from "@supabase/supabase-js";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Handle login form submission
 *
 * @param data - Login form data
 * @param router - Next.js router instance
 * @param setSession - Function to update session in auth store
 * @param fetchProfile - Function to fetch user profile from backend
 */
export async function handleLogin(
	data: LoginInput,
	router: AppRouterInstance,
	setSession: (session: Session | null) => void,
	fetchProfile: () => Promise<void>,
) {
	try {
		const supabase = createBrowserClient();

		// Step 1: Sign in with Supabase
		const { data: authData, error: signInError } =
			await supabase.auth.signInWithPassword({
				email: data.email,
				password: data.password,
			});

		if (signInError) {
			toast.error(signInError.message);
			return;
		}

		if (!authData.session) {
			toast.error("Failed to establish session");
			return;
		}

		// Step 2: Update Zustand store with session
		setSession(authData.session);

		// Step 3: Fetch user profile from NestJS backend
		try {
			await fetchProfile();

			// Get the updated profile from store
			const profile = useAuthStore.getState().userProfile;

			if (!profile) {
				toast.error("Failed to load user profile");
				await supabase.auth.signOut();
				setSession(null);
				return;
			}

			// Step 4: Check if user is deactivated
			if (profile.status === "deactivated") {
				toast.error(
					"Your account has been deactivated. Please contact an administrator.",
				);
				await supabase.auth.signOut();
				setSession(null);
				return;
			}

			// Step 5: Redirect based on role
			const redirectPath = getRedirectPath(profile.role.name);
			toast.success("Login successful");
			router.push(redirectPath);
		} catch (profileError: unknown) {
			// Handle 403 Forbidden (account deactivated)
			const error = profileError as { status?: number; message?: string };
			if (error.status === 403) {
				toast.error(
					"Your account has been deactivated. Please contact an administrator.",
				);
				await supabase.auth.signOut();
				setSession(null);
				return;
			}

			// Handle other profile fetch errors
			console.error("Profile fetch error:", profileError);
			toast.error("Failed to load user profile. Please try again.");
			await supabase.auth.signOut();
			setSession(null);
		}
	} catch (err) {
		console.error("Login error:", err);
		toast.error("An unexpected error occurred");
	}
}

/**
 * Handle password reset email submission
 *
 * @param data - Reset password form data
 * @param onSuccess - Callback function to execute on success
 * @param onError - Callback function to execute on error
 */
export async function handleResetPassword(
	data: ResetPasswordInput,
	onSuccess: () => void,
	onError?: (error: string) => void,
) {
	try {
		const supabase = createBrowserClient();
		// Use /auth/confirm for email OTP verification
		// Supabase will redirect with token_hash and type=recovery
		// The confirm route will verify and redirect to /auth/set-password?mode=reset
		const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
			redirectTo: `${window.location.origin}/auth/confirm`,
		});

		if (error) {
			toast.error(error.message);
			onError?.(error.message);
			return;
		}

		onSuccess();
	} catch (err) {
		console.error("Reset password error:", err);
		const errorMessage = "Failed to send reset email";
		toast.error(errorMessage);
		onError?.(errorMessage);
	}
}

/**
 * Handle setting a new password (account activation or password reset)
 * This is called after the user clicks the invite/reset link and Supabase
 * has already established the session.
 *
 * @param data - Set password form data
 * @param router - Next.js router instance
 * @param setSession - Function to update session in auth store
 * @param fetchProfile - Function to fetch user profile from backend
 */
export async function handleSetPassword(
	data: SetPasswordInput,
	router: AppRouterInstance,
	setSession: (session: Session | null) => void,
	fetchProfile: () => Promise<void>,
) {
	try {
		const supabase = createBrowserClient();

		// Step 1: Update the user's password
		const { data: updateData, error: updateError } =
			await supabase.auth.updateUser({
				password: data.password,
			});

		if (updateError) {
			toast.error(updateError.message);
			return;
		}

		if (!updateData.user) {
			toast.error("Failed to update password");
			return;
		}

		// Step 2: Get the current session
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			toast.error("Session expired. Please try again.");
			router.push("/auth/sign-in");
			return;
		}

		// Step 3: Update the session in Zustand store
		setSession(session);

		// Step 4: Fetch user profile from NestJS backend
		try {
			await fetchProfile();

			// Get the updated profile from store
			const profile = useAuthStore.getState().userProfile;

			if (!profile) {
				toast.error("Failed to load user profile");
				await supabase.auth.signOut();
				setSession(null);
				return;
			}

			// Step 5: Check if user is deactivated
			if (profile.status === "deactivated") {
				toast.error(
					"Your account has been deactivated. Please contact an administrator.",
				);
				await supabase.auth.signOut();
				setSession(null);
				return;
			}

			// Step 6: Redirect based on role
			const redirectPath = getRedirectPath(profile.role.name);
			toast.success("Password set successfully! Welcome to DALI Portal.");
			router.push(redirectPath);
		} catch (profileError: unknown) {
			// Handle 403 Forbidden (account deactivated)
			const error = profileError as { status?: number; message?: string };
			if (error.status === 403) {
				toast.error(
					"Your account has been deactivated. Please contact an administrator.",
				);
				await supabase.auth.signOut();
				setSession(null);
				return;
			}

			// Handle other profile fetch errors
			console.error("Profile fetch error:", profileError);
			toast.error("Failed to load user profile. Please try again.");
			await supabase.auth.signOut();
			setSession(null);
		}
	} catch (err) {
		console.error("Set password error:", err);
		toast.error("An unexpected error occurred");
	}
}
