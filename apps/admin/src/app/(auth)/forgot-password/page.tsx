"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isDefinedError } from "@orpc/client";
import {
	DEACTIVATED_MESSAGE,
	type ResetPasswordInput,
	ResetPasswordSchema,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	ArrowLeft,
	CheckCircle2,
	Loader2,
	Mail,
	Send,
} from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthCard, AuthHeader } from "@/components/auth";
import { api } from "@/lib/api.client";

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
			const [error] = await api.users.requestPasswordReset({
				email: data.email,
			});

			if (error) {
				if (isDefinedError(error)) {
					if (error.code === "DEACTIVATED_ACCOUNT") {
						toast.error(DEACTIVATED_MESSAGE);
					} else {
						toast.error(error.message);
					}
				} else {
					if ((error as { status?: number }).status === 429) {
						toast.error("Too many requests. Please try again later.");
					} else {
						toast.error("Failed to process request");
					}
				}
				return;
			}

			// Regardless of if user existed or not, we show success
			setSubmittedEmail(data.email);
			setEmailSent(true);
		} catch (_err) {
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
					<h3 className="text-xl font-bold text-gray-900 mb-2">
						Check Your Email
					</h3>
					<p className="text-sm text-gray-600 mb-4">
						If an account exists for this email, we've sent a password reset
						link to:
					</p>

					<div className="bg-red-50/50 border border-[#a60202]/20 rounded-xl p-4 mb-5 shadow-sm">
						<p className="text-base font-bold text-[#a60202] break-all">
							{submittedEmail}
						</p>
					</div>

					<div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
						<p className="text-sm text-gray-600 flex gap-2">
							<span className="text-gray-900 font-medium">Note:</span>
							You must click the link within 24 hours before it expires.
						</p>
					</div>
				</div>

				<div className="space-y-3 pt-2">
					<Button
						onClick={() => router.push("/login")}
						className="w-full h-12 bg-[#a60202] hover:bg-[#8a0101] text-white shadow-lg shadow-[#a60202]/20 transition-all duration-200"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Sign In
					</Button>

					<Button
						onClick={handleTryAgain}
						variant="outline"
						className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700"
					>
						Try a different email
					</Button>
				</div>
			</div>
		);
	}

	// Form state
	return (
		<>
			<AuthHeader
				title="Forgot Password"
				subtitle="Enter your email to receive a password reset link"
				icon={Mail}
			/>
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

				<div className="space-y-3">
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

					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/login")}
						className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Sign In
					</Button>
				</div>
			</form>
		</>
	);
}

export default function ForgotPasswordPage() {
	return (
		<AuthCard>
			<ForgotPasswordForm />
		</AuthCard>
	);
}
