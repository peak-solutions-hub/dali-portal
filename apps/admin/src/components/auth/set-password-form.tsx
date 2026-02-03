"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	getRedirectPath,
	type SetPasswordInput,
	SetPasswordSchema,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Key, KeyRound, Loader2 } from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { api, setAuthToken } from "@/lib/api.client";
import { useAuthStore } from "@/stores/auth-store";
import { AuthCard } from "./auth-card";
import { AuthHeader } from "./auth-header";
import { PasswordField } from "./password-field";
import { PasswordValidationTooltip } from "./password-validation-tooltip";

export function SetPasswordForm() {
	const router = useRouter();
	const supabase = createBrowserClient();
	const { fetchProfile } = useAuth();
	const { setSession } = useAuthStore();
	const [hasSession, setHasSession] = useState<boolean | null>(null);
	const [isChecking, setIsChecking] = useState(true);

	const [isPasswordFocused, setIsPasswordFocused] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		trigger,
		formState: { errors, isSubmitting },
	} = useForm<SetPasswordInput>({
		resolver: zodResolver(SetPasswordSchema),
		mode: "onChange", // Validate while typing to provide instant feedback
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	useEffect(() => {
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
					"/login?error=session_expired&message=Your session has expired. Please request a new invite link.",
				);
			}
		};

		checkSession();
	}, [router, supabase]);

	const password = watch("password", "");
	const confirmPassword = watch("confirmPassword", "");

	const handleFormSubmit = async (data: SetPasswordInput) => {
		const isValid = await trigger();
		if (!isValid) {
			toast.error("Password does not meet the security requirements.", {
				description: "Please check the highlighted rules and try again.",
			});
			setIsPasswordFocused(true); // Force tooltip to show
			return;
		}
		await onSubmit(data);
	};

	const onSubmit = async (data: SetPasswordInput) => {
		try {
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

			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session) {
				toast.error("Session expired. Please try again.");
				router.push("/login");
				return;
			}

			setSession(session);
			setAuthToken(session.access_token);

			try {
				const supabaseUserId = updateData.user.id;
				const [activateError] = await api.users.activate({
					id: supabaseUserId,
				});

				if (activateError) {
					console.error("Failed to activate user:", activateError);
				}
			} catch (activateErr) {
				console.error("Activation error:", activateErr);
			}

			try {
				// fetchProfile now returns the profile directly - no need for fragile delays
				const profile = await fetchProfile(session.access_token);

				if (!profile) {
					toast.error("Failed to load user profile");
					await supabase.auth.signOut();
					setSession(null);
					return;
				}

				if (profile.status === "deactivated") {
					toast.error(
						"Your account has been deactivated. Please contact an administrator.",
					);
					await supabase.auth.signOut();
					setSession(null);
					return;
				}

				const redirectPath = getRedirectPath(profile.role.name);
				toast.success("Password updated successfully! Welcome to DALI Portal.");
				router.push(redirectPath);
			} catch (profileError: unknown) {
				const error = profileError as { status?: number; message?: string };
				if (error.status === 403) {
					toast.error(
						"Your account has been deactivated. Please contact an administrator.",
					);
					await supabase.auth.signOut();
					setSession(null);
					return;
				}

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

	if (isChecking || hasSession === null) {
		return (
			<AuthCard>
				<div className="flex flex-col items-center justify-center py-12">
					<Loader2 className="w-8 h-8 animate-spin text-[#a60202] mb-4" />
					<p className="text-gray-600 text-sm">Checking session...</p>
				</div>
			</AuthCard>
		);
	}

	return (
		<AuthCard>
			<AuthHeader
				title="Update Your Password"
				subtitle="Create a secure password for your account"
				icon={KeyRound}
			/>

			<form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
				<div className="relative">
					<PasswordValidationTooltip
						password={password}
						isOpen={
							isPasswordFocused || (password.length > 0 && !!errors.password)
						}
					>
						<div
							onFocusCapture={() => setIsPasswordFocused(true)}
							onBlurCapture={() => setIsPasswordFocused(false)}
						>
							<PasswordField
								id="password"
								label="New Password"
								register={register("password")}
								placeholder="••••••••"
								showIcon={password.length > 0}
								disabled={isSubmitting}
								error={errors.password?.message}
							/>
						</div>
					</PasswordValidationTooltip>
				</div>

				<div>
					<PasswordField
						id="confirmPassword"
						label="Confirm Password"
						register={register("confirmPassword")}
						placeholder="••••••••"
						showIcon={confirmPassword.length > 0}
						disabled={isSubmitting}
						error={errors.confirmPassword?.message}
					/>
				</div>

				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full h-12 bg-[#a60202] hover:bg-[#8a0101] text-white shadow-lg shadow-[#a60202]/20 transition-all duration-200"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
						</>
					) : (
						<>
							<Key className="w-4 h-4 mr-2" /> Update Password
						</>
					)}
				</Button>
			</form>
		</AuthCard>
	);
}
