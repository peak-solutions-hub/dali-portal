"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getRedirectPath, type LoginInput, LoginSchema } from "@repo/shared";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { AlertCircle, Loader2, Mail, Shield } from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { AuthCard, AuthHeader, PasswordField } from ".";

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { setSession, fetchProfile } = useAuthStore();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<LoginInput>({
		resolver: zodResolver(LoginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	useEffect(() => {
		const error = searchParams.get("error");
		const message = searchParams.get("message");

		if ((error === "invalid_link" || error === "auth_code_error") && message) {
			setErrorMessage(message);
		}
	}, [searchParams]);

	const onSubmit = async (data: LoginInput) => {
		try {
			const supabase = createBrowserClient();

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

			setSession(authData.session);

			try {
				await fetchProfile();
				const profile = useAuthStore.getState().userProfile;

				if (profile) {
					if (profile.status === "deactivated") {
						toast.error(
							"Your account has been deactivated. Please contact an administrator.",
						);
						await supabase.auth.signOut();
						setSession(null);
						return;
					}

					const redirectPath = getRedirectPath(profile.role.name);
					toast.success("Login successful");
					router.push(redirectPath);
					router.refresh();
					return;
				}
			} catch (err) {
				console.error("Profile fetch error:", err);
			}

			toast.success("Login successful");
			router.push("/dashboard");
			router.refresh();
		} catch (err) {
			console.error("Login error:", err);
			toast.error("An unexpected error occurred");
		}
	};

	const passwordValue = watch("password", "");

	return (
		<AuthCard>
			<AuthHeader />

			{errorMessage && (
				<Alert variant="destructive" className="mb-6">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<div>
					<label
						htmlFor="email"
						className="block mb-2 text-sm font-semibold text-gray-700"
					>
						Email Address
					</label>
					<div className="relative">
						<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<Input
							id="email"
							type="email"
							{...register("email")}
							placeholder="your.email@iloilo.gov.ph"
							className="h-12 pl-11 border-gray-300 focus:border-[#a60202] focus:ring-[#a60202]"
							disabled={isSubmitting}
							autoComplete="email"
						/>
					</div>
					{errors.email && (
						<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
					)}
				</div>

				<div>
					<PasswordField
						id="password"
						label="Password"
						register={register("password")}
						placeholder="••••••••"
						showIcon={passwordValue.length > 0}
						disabled={isSubmitting}
						error={errors.password?.message}
					/>
				</div>

				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full h-12 bg-[#a60202] hover:bg-[#8a0101] text-white shadow-lg shadow-[#a60202]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Signing in...
						</>
					) : (
						<>
							<Shield className="w-4 h-4 mr-2" />
							Sign In
						</>
					)}
				</Button>

				<div className="text-center pt-2">
					<Link
						href="/forgot-password"
						className="text-sm text-[#a60202] hover:text-[#8a0101] hover:underline font-medium"
					>
						Forgot your password?
					</Link>
				</div>
			</form>
		</AuthCard>
	);
}
