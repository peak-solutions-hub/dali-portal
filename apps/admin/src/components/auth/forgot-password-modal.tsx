"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ResetPasswordInput, ResetPasswordSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { CheckCircle2, Loader2, Mail, Send } from "@repo/ui/lib/lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { handleResetPassword } from "@/helpers/auth";

interface ForgotPasswordModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({
	open,
	onOpenChange,
}: ForgotPasswordModalProps) {
	const [resetEmailSent, setResetEmailSent] = useState(false);
	const [isResetLoading, setIsResetLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<ResetPasswordInput>({
		resolver: zodResolver(ResetPasswordSchema),
	});

	const onSubmit = async (data: ResetPasswordInput) => {
		setIsResetLoading(true);

		await handleResetPassword(
			data,
			() => setResetEmailSent(true),
			() => setIsResetLoading(false),
		);

		setIsResetLoading(false);
	};

	const handleClose = () => {
		onOpenChange(false);
		setResetEmailSent(false);
		reset();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-106.25">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Mail className="w-5 h-5 text-[#a60202]" />
						Forgot Password
					</DialogTitle>
					<DialogDescription>
						Enter your email address and we'll send you a password reset link.
					</DialogDescription>
				</DialogHeader>

				{!resetEmailSent ? (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
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
									disabled={isResetLoading}
								/>
							</div>
							{errors.email && (
								<p className="mt-1 text-sm text-red-600">
									{errors.email.message}
								</p>
							)}
						</div>

						<Button
							type="submit"
							disabled={isResetLoading}
							className="w-full h-12 bg-[#a60202] hover:bg-[#8a0101] text-white shadow-lg shadow-[#a60202]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isResetLoading ? (
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
					</form>
				) : (
					<div className="py-6">
						<div className="text-center">
							<div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
								<CheckCircle2 className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Email Sent!
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								We've sent a password reset link to your email address.
							</p>
							<p className="text-xs text-gray-500">
								Please check your email and click the link to reset your
								password. The link will expire in 24 hours.
							</p>
						</div>

						<Button
							onClick={handleClose}
							variant="outline"
							className="w-full mt-6"
						>
							Close
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
