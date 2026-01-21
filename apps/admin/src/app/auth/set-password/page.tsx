"use client";

import { Card } from "@repo/ui/components/card";
import { Loader2 } from "@repo/ui/lib/lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
	AuthBackground,
	SetPasswordForm,
	SetPasswordHeader,
} from "@/components/auth";
import { useAuthStore } from "@/stores/auth-store";

function SetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { session, isLoading } = useAuthStore();
	const [isChecking, setIsChecking] = useState(true);

	// Determine if this is password reset (forgot password) or initial setup (invite)
	const mode = searchParams.get("mode");
	const isResetMode = mode === "reset";

	useEffect(() => {
		// Wait for auth store to finish loading
		if (isLoading) {
			return;
		}

		// If no session exists after auth provider has loaded,
		// the invite/reset link was invalid or expired
		if (!session) {
			router.push("/auth/sign-in");
			return;
		}

		setIsChecking(false);
	}, [session, isLoading, router]);

	// Show loading state while checking session
	if (isLoading || isChecking) {
		return (
			<div className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
				<AuthBackground />
				<Card className="w-full max-w-md mx-4 p-8 relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-[#FFC107]/20">
					<div className="flex flex-col items-center justify-center py-8">
						<Loader2 className="w-8 h-8 animate-spin text-[#a60202] mb-4" />
						<p className="text-gray-600 text-sm">
							{isResetMode
								? "Verifying your reset link..."
								: "Verifying your invite link..."}
						</p>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
			{/* Background */}
			<AuthBackground />

			{/* Content Card */}
			<Card className="w-full max-w-md mx-4 p-6 sm:p-8 relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-[#FFC107]/20 max-h-[90vh] overflow-y-auto">
				<SetPasswordHeader
					title={isResetMode ? "Reset Your Password" : undefined}
					subtitle={
						isResetMode
							? "Enter a new secure password for your account"
							: undefined
					}
				/>
				<SetPasswordForm isResetMode={isResetMode} />
			</Card>
		</div>
	);
}

export default function SetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
					<AuthBackground />
					<Card className="w-full max-w-md mx-4 p-8 relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-[#FFC107]/20">
						<div className="flex flex-col items-center justify-center py-8">
							<Loader2 className="w-8 h-8 animate-spin text-[#a60202] mb-4" />
							<p className="text-gray-600 text-sm">Loading...</p>
						</div>
					</Card>
				</div>
			}
		>
			<SetPasswordContent />
		</Suspense>
	);
}
