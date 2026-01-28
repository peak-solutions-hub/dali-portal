"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getRedirectPath, type LoginInput, LoginSchema } from "@repo/shared";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	AlertCircle,
	Eye,
	EyeOff,
	Key,
	Loader2,
	Lock,
	Mail,
	Shield,
} from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthCard, AuthHeader } from "@/components/auth";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Login form component with inline auth logic
 */
function LoginForm() {
	const router = useRouter();
	const { setSession, fetchProfile } = useAuthStore();
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginInput>({
		resolver: zodResolver(LoginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginInput) => {
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

			// Step 2: Set session in store
			setSession(authData.session);

			// Step 3: Fetch profile manually for role-based redirect
			// This avoids waiting for AuthContext subscription
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
				} else {
					// Fallback if profile fetch fails but auth succeeded
					toast.success("Login successful");
					router.push("/dashboard");
					router.refresh();
				}
			} catch (error) {
				console.error("Profile fetch error:", error);
				// Fallback to dashboard
				router.push("/dashboard");
				router.refresh();
			}
		} catch (err) {
			console.error("Login error:", err);
			toast.error("An unexpected error occurred");
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div>
				<label className="block mb-2 text-sm font-semibold text-gray-700">
					Email Address
				</label>
				<div className="relative">
					<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<Input
						type="email"
						{...register("email")}
						placeholder="your.email@iloilo.gov.ph"
						className="h-12 pl-11 border-gray-300 focus:border-[#a60202] focus:ring-[#a60202]"
						disabled={isSubmitting}
					/>
				</div>
				{errors.email && (
					<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
				)}
			</div>

			<div>
				<label className="block mb-2 text-sm font-semibold text-gray-700">
					Password
				</label>
				<div className="relative">
					<Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<Input
						type={showPassword ? "text" : "password"}
						{...register("password")}
						placeholder="••••••••"
						className="h-12 pl-11 pr-10 border-gray-300 focus:border-[#a60202] focus:ring-[#a60202]"
						disabled={isSubmitting}
					/>
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
					>
						{showPassword ? (
							<EyeOff className="w-5 h-5" />
						) : (
							<Eye className="w-5 h-5" />
						)}
					</button>
				</div>
				{errors.password && (
					<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
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
						Signing in...
					</>
				) : (
					<>
						<Shield className="w-4 h-4 mr-2" />
						Sign In
					</>
				)}
			</Button>

			<div className="text-center">
				<Link
					href="/forgot-password"
					className="text-sm text-[#a60202] hover:text-[#8a0101] hover:underline font-medium"
				>
					Forgot your password?
				</Link>
			</div>
		</form>
	);
}

function SignInContent() {
	const searchParams = useSearchParams();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		// Check for error messages from redirects
		const error = searchParams.get("error");
		const message = searchParams.get("message");

		if ((error === "invalid_link" || error === "auth_code_error") && message) {
			setErrorMessage(message);
		}
	}, [searchParams]);

	return (
		<AuthCard>
			<AuthHeader
				title="Sangguniang Panlungsod"
				subtitle="Internal Management System"
				icon={Lock}
			/>

			{/* Error Alert */}
			{errorMessage && (
				<Alert variant="destructive" className="mb-4">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}

			<LoginForm />
		</AuthCard>
	);
}

export default function SignInPage() {
	return (
		<Suspense
			fallback={
				<div className="h-screen w-screen flex items-center justify-center">
					Loading...
				</div>
			}
		>
			<SignInContent />
		</Suspense>
	);
}
