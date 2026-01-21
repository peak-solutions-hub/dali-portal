"use client";

import { Card } from "@repo/ui/components/card";
import { Loader2, Shield } from "@repo/ui/lib/lucide-react";
import { createBrowserClient } from "@repo/ui/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
 * Client-side auth confirmation page
 *
 * Handles Supabase authentication tokens from email verification links.
 * Supports both implicit flow (hash fragments) and PKCE flow.
 *
 * Implicit flow (hash fragments): #access_token=...&refresh_token=...&type=invite
 * PKCE flow (query params): ?token_hash=...&type=invite
 *
 * This unified approach ensures all auth flows work properly.
 */
export default function AuthConfirmPage() {
	const router = useRouter();
	const [status, setStatus] = useState<"loading" | "error" | "success">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		const handleAuthConfirmation = async () => {
			const supabase = createBrowserClient();

			try {
				// Priority 1: Check hash fragments for implicit flow (invite emails)
				const hashParams = new URLSearchParams(
					window.location.hash.substring(1), // Remove the leading #
				);

				const accessToken = hashParams.get("access_token");
				const refreshToken = hashParams.get("refresh_token");
				const hashType = hashParams.get("type");

				if (accessToken && refreshToken) {
					console.log(`[AuthConfirm] Processing implicit flow: ${hashType}`);

					const { data, error } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});

					if (error) {
						console.error("[AuthConfirm] Failed to set session:", error);
						setErrorMessage(error.message);
						setStatus("error");
						return;
					}

					if (data.session) {
						console.log(`[AuthConfirm] Session established for ${hashType}`);

						// Wait a moment for the session to propagate to auth store
						// This prevents race conditions with the auth provider
						await new Promise((resolve) => setTimeout(resolve, 500));

						setStatus("success");

						// Clear hash from URL for security
						window.history.replaceState(null, "", window.location.pathname);

						// Redirect based on type
						if (
							hashType === "invite" ||
							hashType === "signup" ||
							hashType === "recovery"
						) {
							router.push("/auth/set-password");
						} else {
							router.push("/dashboard");
						}
						return;
					}
				}

				// Priority 2: Check query params for PKCE flow
				const searchParams = new URLSearchParams(window.location.search);
				const tokenHash = searchParams.get("token_hash");
				const otpType = searchParams.get("type") as
					| "signup"
					| "invite"
					| "recovery"
					| "email"
					| "magiclink"
					| null;

				if (tokenHash && otpType) {
					console.log(`[AuthConfirm] Processing PKCE flow: ${otpType}`);

					const { error } = await supabase.auth.verifyOtp({
						type: otpType,
						token_hash: tokenHash,
					});

					if (error) {
						console.error("[AuthConfirm] OTP verification failed:", error);
						setErrorMessage(error.message);
						setStatus("error");
						return;
					}

					console.log(`[AuthConfirm] OTP verified for ${otpType}`);

					// Wait for session propagation
					await new Promise((resolve) => setTimeout(resolve, 500));

					setStatus("success");

					// Redirect based on type
					if (
						otpType === "invite" ||
						otpType === "signup" ||
						otpType === "recovery"
					) {
						router.push("/auth/set-password");
					} else {
						router.push("/dashboard");
					}
					return;
				}

				// Priority 3: Check for existing session
				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (session) {
					console.log("[AuthConfirm] Existing session found, redirecting");
					setStatus("success");
					router.push("/dashboard");
					return;
				}

				// No tokens or session found
				console.log("[AuthConfirm] No authentication tokens found");
				setErrorMessage(
					"The verification link is invalid or has expired. Please request a new one.",
				);
				setStatus("error");
			} catch (error) {
				console.error("[AuthConfirm] Unexpected error:", error);
				setErrorMessage("An unexpected error occurred during verification.");
				setStatus("error");
			}
		};

		handleAuthConfirmation();
	}, [router]);

	// Auto-redirect to sign-in on error
	useEffect(() => {
		if (status === "error") {
			const timeout = setTimeout(() => {
				const errorUrl = new URL("/auth/sign-in", window.location.origin);
				errorUrl.searchParams.set("error", "invalid_link");
				errorUrl.searchParams.set(
					"message",
					errorMessage || "The verification link is invalid or has expired.",
				);
				router.push(errorUrl.toString().replace(window.location.origin, ""));
			}, 3000); // Give user time to read the error

			return () => clearTimeout(timeout);
		}
	}, [status, errorMessage, router]);

	return (
		<div className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
			<AuthBackground />

			<Card className="relative w-full max-w-md mx-4 sm:mx-0 p-8 bg-white/95 backdrop-blur-sm shadow-2xl border-0">
				<div className="text-center">
					<div className="mb-6 flex justify-center">
						<div className="relative">
							<img
								src="/iloilo-city-seal.png"
								alt="Iloilo City Council Seal"
								className="w-16 h-16 object-contain"
							/>
							<div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#a60202] flex items-center justify-center shadow-lg">
								<Shield className="w-3 h-3 text-[#FFC107]" />
							</div>
						</div>
					</div>

					{status === "loading" && (
						<>
							<Loader2 className="w-8 h-8 animate-spin text-[#a60202] mx-auto mb-4" />
							<h2 className="text-lg font-semibold text-gray-900">
								Verifying your account...
							</h2>
							<p className="text-sm text-gray-600 mt-2">
								Please wait while we confirm your identity.
							</p>
						</>
					)}

					{status === "success" && (
						<>
							<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<h2 className="text-lg font-semibold text-gray-900">
								Verification successful!
							</h2>
							<p className="text-sm text-gray-600 mt-2">
								Redirecting you now...
							</p>
						</>
					)}

					{status === "error" && (
						<>
							<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-6 h-6 text-red-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</div>
							<h2 className="text-lg font-semibold text-gray-900">
								Verification failed
							</h2>
							<p className="text-sm text-gray-600 mt-2">
								{errorMessage || "The link is invalid or has expired."}
							</p>
							<p className="text-xs text-gray-500 mt-2">
								Redirecting to sign-in in 3 seconds...
							</p>
						</>
					)}
				</div>
			</Card>
		</div>
	);
}
