"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	passwordRequirements,
	type SetPasswordInput,
	SetPasswordSchema,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Check, Key, Loader2, Shield, X } from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { handleSetPassword } from "@/helpers/auth";
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

interface SetPasswordFormProps {
	/** Whether this is password reset mode (from forgot password) vs initial setup (from invite) */
	isResetMode?: boolean;
}

export function SetPasswordForm({ isResetMode = false }: SetPasswordFormProps) {
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
		await handleSetPassword(data, router, setSession, fetchProfile);
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
						{isResetMode ? "Resetting password..." : "Setting password..."}
					</>
				) : (
					<>
						<Shield className="w-4 h-4 mr-2" />
						{isResetMode
							? "Reset Password & Sign In"
							: "Set Password & Continue"}
					</>
				)}
			</Button>
		</form>
	);
}
