"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ArrowLeft, Loader2 } from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	AuthBackground,
	SetPasswordForm,
	SetPasswordHeader,
} from "@/components/auth";
import { useAuthStore } from "@/stores/auth-store";

export default function UpdatePasswordPage() {
	const router = useRouter();
	const { session, isLoading } = useAuthStore();
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		// Wait for auth store to finish loading
		if (isLoading) {
			return;
		}

		// If no session exists after auth provider has loaded,
		// the reset link was invalid or expired
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
							Verifying your reset link...
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

			{/* Back to Sign In Button */}
			<Button
				onClick={() => router.push("/auth/sign-in")}
				variant="ghost"
				className="absolute top-4 left-4 z-20 text-white hover:bg-white/20 hover:text-white"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back to Sign In
			</Button>

			{/* Content Card */}
			<Card className="w-full max-w-md mx-4 p-6 sm:p-8 relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-[#FFC107]/20 max-h-[90vh] overflow-y-auto">
				<SetPasswordHeader
					title="Reset Your Password"
					subtitle="Enter a new secure password for your account"
				/>
				<SetPasswordForm />
			</Card>
		</div>
	);
}
