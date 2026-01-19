"use client";

import { Card } from "@repo/ui/components/card";
import {
	AuthBackground,
	ForgotPasswordForm,
	ForgotPasswordHeader,
} from "@/components/auth";

export default function ForgotPasswordPage() {
	return (
		<div className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
			{/* Background */}
			<AuthBackground />

			{/* Content Card */}
			<Card className="w-full max-w-md mx-4 p-6 sm:p-8 relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-[#FFC107]/20">
				<ForgotPasswordHeader />
				<ForgotPasswordForm showBackLink={true} />
			</Card>
		</div>
	);
}
