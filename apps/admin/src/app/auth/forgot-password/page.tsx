"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ResetPasswordInput, ResetPasswordSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
	ArrowLeft,
	CheckCircle2,
	Loader2,
	Mail,
	Send,
	Shield,
} from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

/**
 * Background component with gradient and decorative elements
 */
function AuthBackground() {
	return (
		<>
			{/* Background Gradient */}
			<div className="absolute inset-0 bg-linear-to-br from-red-600/95 via-[#a60202]/90 to-red-950/95" />

			{/* Decorative Elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-64 h-64 bg-[#FFC107]/10 rounded-full blur-3xl" />
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
			</div>
		</>
	);
}

/**
 * Header component with city seal and branding
 */
function ForgotPasswordHeader() {
	return (
		<div className="text-center mb-6">
			<div className="mb-4 flex justify-center">
				<div className="relative">
					<img
						src="/iloilo-city-seal.png"
						alt="Iloilo City Council Seal"
						className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
					/>
					<div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#a60202] flex items-center justify-center shadow-lg">
						<Shield className="w-4 h-4 text-[#FFC107]" />
					</div>
				</div>
			</div>

			<h1
				className="text-xl sm:text-2xl text-[#a60202] mb-1"
				style={{ fontFamily: "Playfair Display, serif" }}
			>
				Sangguniang Panlungsod
			</h1>
			<p className="text-gray-700 text-xs mb-3">ng Iloilo</p>

			<div className="flex items-center justify-center gap-2 mt-2">
				<div className="h-px w-8 bg-[#FFC107]" />
				<Mail className="w-4 h-4 text-[#a60202]" />
				<div className="h-px w-8 bg-[#FFC107]" />
			</div>

			<h2 className="text-lg font-semibold text-gray-900 mt-3">
				Forgot Password
			</h2>
			<p className="text-xs text-gray-600 mt-1">
				Enter your email to receive a password reset link
			</p>
		</div>
	);
}

/**
 * Forgot password form with inline auth logic
 */
function ForgotPasswordForm() {
	const router = useRouter();
	const [emailSent, setEmailSent] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<ResetPasswordInput>({
		resolver: zodResolver(ResetPasswordSchema),
	});

	const onSubmit = async (data: ResetPasswordInput) => {
		try {
			const supabase = createBrowserClient();
			// Use /auth/confirm for email OTP verification
			// Supabase will redirect with token_hash and type=recovery
			const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
				redirectTo: `${window.location.origin}/auth/confirm`,
			});

			if (error) {
				toast.error(error.message);
				return;
			}

			setSubmittedEmail(data.email);
			setEmailSent(true);
		} catch (err) {
			console.error("Reset password error:", err);
			toast.error("Failed to send reset email");
		}
	};

	const handleTryAgain = () => {
		setEmailSent(false);
		setSubmittedEmail("");
		reset();
	};

	// Success state - email sent
	if (emailSent) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
						<CheckCircle2 className="w-8 h-8 text-green-600" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Check Your Email
					</h3>
					<p className="text-sm text-gray-600 mb-2">
						We've sent a password reset link to:
					</p>
					<p className="text-sm font-medium text-[#a60202] mb-4">
						{submittedEmail}
					</p>
					<p className="text-xs text-gray-500">
						Click the link in the email to reset your password. The link will
						expire in 24 hours.
					</p>
				</div>

				<div className="space-y-3">
					<Button onClick={handleTryAgain} variant="outline" className="w-full">
						Try a different email
					</Button>

					<Button
						onClick={() => router.push("/auth/sign-in")}
						variant="ghost"
						className="w-full text-[#a60202] hover:text-[#8a0101] hover:bg-red-50"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Sign In
					</Button>
				</div>
			</div>
		);
	}

	// Form state
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

			<Button
				type="submit"
				disabled={isSubmitting}
				className="w-full h-12 bg-[#a60202] hover:bg-[#8a0101] text-white shadow-lg shadow-[#a60202]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						Sending...
					</>
				) : (
					<>
						<Send className="w-4 h-4 mr-2" />
						Send Reset Link
					</>
				)}
			</Button>

			<div className="text-center">
				<button
					type="button"
					onClick={() => router.push("/auth/sign-in")}
					className="text-sm text-[#a60202] hover:text-[#8a0101] hover:underline font-medium inline-flex items-center gap-1"
				>
					<ArrowLeft className="w-3 h-3" />
					Back to Sign In
				</button>
			</div>
		</form>
	);
}

export default function ForgotPasswordPage() {
	return (
		<div className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
			{/* Background */}
			<AuthBackground />

			{/* Content Card */}
			<Card className="w-full max-w-md mx-4 p-6 sm:p-8 relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-[#FFC107]/20">
				<ForgotPasswordHeader />
				<ForgotPasswordForm />
			</Card>
		</div>
	);
}
