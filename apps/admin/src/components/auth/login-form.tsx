"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, LoginSchema } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Key, Loader2, Mail, Shield } from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { handleLogin } from "@/helpers/auth";
import { useAuthStore } from "@/stores/auth-store";

interface LoginFormProps {
	onForgotPassword: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
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
		await handleLogin(data, router, setSession, fetchProfile);
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
				<button
					type="button"
					onClick={onForgotPassword}
					className="text-sm text-[#a60202] hover:text-[#8a0101] hover:underline font-medium"
				>
					Forgot your password?
				</button>
			</div>
		</form>
	);
}
