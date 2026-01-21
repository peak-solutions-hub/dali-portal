"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	getRedirectPath,
	passwordRequirements,
	type SetPasswordInput,
	SetPasswordSchema,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Check, Key, KeyRound, Loader2, X } from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthBackground, AuthCard, AuthHeader } from "@/components/auth";
import { api } from "@/lib/api.client";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Password requirement indicator component
 */
function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
	return (
		<div className="flex items-center gap-2 text-xs">
			{met ? (
				<Check className="w-3 h-3 text-green-600" />
			) : (
				<X className="w-3 h-3 text-gray-400" />
			)}
			<span className={met ? "text-green-600" : "text-gray-500"}>{label}</span>
		</div>
	);
}

/**
 * Set password form with inline auth logic
 */
function SetPasswordForm() {
	const router = useRouter();
	const { setSession, fetchProfile } = useAuthStore();

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<SetPasswordInput>({
		resolver: zodResolver(SetPasswordSchema),
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	const password = watch("password", "");

	// Check password requirements
	const requirements = {
		minLength: password.length >= passwordRequirements.minLength,
		uppercase: passwordRequirements.patterns.uppercase.test(password),
		lowercase: passwordRequirements.patterns.lowercase.test(password),
		number: passwordRequirements.patterns.number.test(password),
		special: passwordRequirements.patterns.special.test(password),
	};

	const onSubmit = async (data: SetPasswordInput) => {
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

			// Step 4: Activate user (change status from 'invited' to 'active')
			try {
				const supabaseUserId = updateData.user.id;
				const [activateError] = await api.users.activate({
					id: supabaseUserId,
				});

				if (activateError) {
					console.error("Failed to activate user:", activateError);
					// Continue anyway - user might already be active
				}
			} catch (activateErr) {
				console.error("Activation error:", activateErr);
				// Continue anyway
			}

			// Step 5: Fetch user profile from NestJS backend
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

				// Step 6: Check if user is deactivated
				if (profile.status === "deactivated") {
					toast.error(
						"Your account has been deactivated. Please contact an administrator.",
					);
					await supabase.auth.signOut();
					setSession(null);
					return;
				}

				// Step 7: Redirect based on role
				const redirectPath = getRedirectPath(profile.role.name);
				toast.success("Password updated successfully! Welcome to DALI Portal.");
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
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
			<div>
				<label className="block mb-2 text-sm font-semibold text-gray-700">
					New Password
				</label>
				<div className="relative">
					<Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<Input
						type="password"
						{...register("password")}
						placeholder="••••••••"
						className="h-12 pl-11 border-gray-300 focus:border-[#a60202] focus:ring-[#a60202]"
						disabled={isSubmitting}
					/>
				</div>
				{errors.password && (
					<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
				)}

				{/* Password Requirements Checklist */}
				<div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1.5">
					<p className="text-xs font-medium text-gray-600 mb-2">
						Password requirements:
					</p>
					<PasswordRequirement
						met={requirements.minLength}
						label="At least 8 characters"
					/>
					<PasswordRequirement
						met={requirements.uppercase}
						label="One uppercase letter"
					/>
					<PasswordRequirement
						met={requirements.lowercase}
						label="One lowercase letter"
					/>
					<PasswordRequirement met={requirements.number} label="One number" />
					<PasswordRequirement
						met={requirements.special}
						label="One special character (!@#$%^&*)"
					/>
				</div>
			</div>

			<div>
				<label className="block mb-2 text-sm font-semibold text-gray-700">
					Confirm Password
				</label>
				<div className="relative">
					<Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<Input
						type="password"
						{...register("confirmPassword")}
						placeholder="••••••••"
						className="h-12 pl-11 border-gray-300 focus:border-[#a60202] focus:ring-[#a60202]"
						disabled={isSubmitting}
					/>
				</div>
				{errors.confirmPassword && (
					<p className="mt-1 text-sm text-red-600">
						{errors.confirmPassword.message}
					</p>
				)}
			</div>

			<Button
				type="submit"
				disabled={isSubmitting}
				className="w-full h-12 bg-[#a60202] hover:bg-[#8a0101] text-white shadow-lg shadow-[#a60202]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						Updating password...
					</>
				) : (
					<>
						<Key className="w-4 h-4 mr-2" />
						Update Password & Continue
					</>
				)}
			</Button>
		</form>
	);
}

function SetPasswordContent() {
	const router = useRouter();
	const supabase = createBrowserClient();
	const [hasSession, setHasSession] = useState<boolean | null>(null);
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		// Check for session directly from Supabase (not auth store)
		// This is important because after invite/recovery link verification,
		// the session exists in Supabase but may not be in auth store yet
		const checkSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (session) {
				console.log("[SetPassword] Session found, allowing password setup");
				setHasSession(true);
				setIsChecking(false);
			} else {
				console.log("[SetPassword] No session found, redirecting to sign-in");
				setHasSession(false);
				router.push(
					"/auth/sign-in?error=session_expired&message=Your session has expired. Please request a new invite link.",
				);
			}
		};

		checkSession();
	}, [router, supabase]);

	// Show loading state while checking session
	if (isChecking || hasSession === null) {
		return (
			<AuthCard>
				<div className="flex flex-col items-center justify-center py-8">
					<Loader2 className="w-8 h-8 animate-spin text-[#a60202] mb-4" />
					<p className="text-gray-600 text-sm">Checking session...</p>
				</div>
			</AuthCard>
		);
	}

	return (
		<AuthCard className="max-h-[90vh] overflow-y-auto">
			<AuthHeader
				title="Update Your Password"
				subtitle="Create a secure password for your account"
				icon={KeyRound}
			/>
			<SetPasswordForm />
		</AuthCard>
	);
}

export default function SetPasswordPage() {
	return (
		<Suspense
			fallback={
				<AuthCard>
					<div className="flex flex-col items-center justify-center py-8">
						<Loader2 className="w-8 h-8 animate-spin text-[#a60202] mb-4" />
						<p className="text-gray-600 text-sm">Loading...</p>
					</div>
				</AuthCard>
			}
		>
			<SetPasswordContent />
		</Suspense>
	);
}
