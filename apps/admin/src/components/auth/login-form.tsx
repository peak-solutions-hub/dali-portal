"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, LoginSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Loader2, Mail, Shield } from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useAuthStore } from "@/stores/auth-store";
import { AuthCard, AuthHeader, PasswordField } from ".";

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isLoading: isAuthLoading } = useAuth();
	const { setSession } = useAuthStore();

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

	// Handle URL-param errors from auth callback (server Route Handler)
	useEffect(() => {
		const error = searchParams.get("error");
		const message = searchParams.get("message");

		if (
			(error === "invalid_link" ||
				error === "auth_code_error" ||
				error === "session_expired") &&
			message
		) {
			toast.error(message);
			router.replace("/login");
		}
	}, [searchParams, router]);

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

			// Set session in Zustand — this triggers auth-context's SIGNED_IN handler
			// which owns profile fetching, deactivated detection, redirect, and success toast
			setSession(authData.session);
		} catch (_err) {
			toast.error("An unexpected error occurred");
		}
	};

	const passwordValue = watch("password", "");
	const isBusy = isSubmitting || isAuthLoading;

	return (
		<AuthCard>
			<AuthHeader />

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
							disabled={isBusy}
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
						disabled={isBusy}
						error={errors.password?.message}
					/>
				</div>

				<Button
					type="submit"
					disabled={isBusy}
					className="w-full h-12 bg-[#a60202] hover:bg-[#8a0101] text-white shadow-lg shadow-[#a60202]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isBusy ? (
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
