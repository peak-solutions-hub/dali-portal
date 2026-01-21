"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getRedirectPath, type LoginInput, LoginSchema } from "@repo/shared";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	AlertCircle,
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

			// Step 2: Wait for AuthContext to handle SIGNED_IN event
			// The AuthContext will automatically fetch profile and update state
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Step 3: Get profile from store (should be set by AuthContext)
			let profile = useAuthStore.getState().userProfile;

			if (!profile) {
				// Profile not loaded yet by AuthContext, try fetching manually
				console.log(
					"[SignIn] Profile not loaded by AuthContext, fetching manually",
				);
				setSession(authData.session);
				await fetchProfile();
				profile = useAuthStore.getState().userProfile;
			}

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
					href="/auth/forgot-password"
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
