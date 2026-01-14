"use client";

import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SetPasswordPage() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleSetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validate passwords match
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		// Validate password strength
		if (password.length < 8) {
			setError("Password must be at least 8 characters long");
			return;
		}

		setIsLoading(true);

		try {
			const supabase = createSupabaseBrowserClient();

			// Since the user arrived via the invite link, they have an active session.
			// updateUser allows them to set their password for the first time.
			const { error: updateError } = await supabase.auth.updateUser({
				password: password,
			});

			if (updateError) {
				setError(updateError.message);
				return;
			}

			// Password set successfully, redirect to dashboard
			router.push("/dashboard");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "An unexpected error occurred",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
						Welcome to DALI Portal
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Set your password to complete your account setup
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSetPassword}>
					<div className="space-y-4 rounded-md shadow-sm">
						<div>
							<label htmlFor="password" className="sr-only">
								New Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								required
								className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
								placeholder="New Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isLoading}
								minLength={8}
							/>
						</div>
						<div>
							<label htmlFor="confirm-password" className="sr-only">
								Confirm Password
							</label>
							<input
								id="confirm-password"
								name="confirm-password"
								type="password"
								required
								className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
								placeholder="Confirm Password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								disabled={isLoading}
								minLength={8}
							/>
						</div>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 p-4">
							<p className="text-sm text-red-800">{error}</p>
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? "Setting password..." : "Set Password and Continue"}
						</button>
					</div>
				</form>

				<p className="mt-4 text-center text-xs text-gray-500">
					Password must be at least 8 characters long
				</p>
			</div>
		</div>
	);
}
