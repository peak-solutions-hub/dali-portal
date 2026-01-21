"use client";

import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { AlertCircle, ArrowLeft } from "@repo/ui/lib/lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
	AuthBackground,
	AuthHeader,
	ForgotPasswordModal,
	LoginForm,
} from "@/components/auth";

function SignInContent() {
	const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
	const searchParams = useSearchParams();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		// Check for error messages from redirects
		const error = searchParams.get("error");
		const message = searchParams.get("message");

		if ((error === "invalid_link" || error === "auth_code_error") && message) {
			setErrorMessage(message);
		}
	}, [searchParams]);

	return (
		<div className="h-screen w-screen relative flex items-center justify-center overflow-hidden">
			{/* Background */}
			<AuthBackground />

			{/* Content Card */}
			<Card className="w-full max-w-md mx-4 p-6 sm:p-8 relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-[#FFC107]/20">
				<AuthHeader />

				{/* Error Alert */}
				{errorMessage && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}

				<LoginForm onForgotPassword={() => setShowForgotPasswordModal(true)} />
			</Card>

			{/* Forgot Password Modal */}
			<ForgotPasswordModal
				open={showForgotPasswordModal}
				onOpenChange={setShowForgotPasswordModal}
			/>
		</div>
	);
}

export default function SignInPage() {
	return (
		<Suspense
			fallback={
				<div className="h-screen w-screen flex items-center justify-center">
					Loading...
				</div>
			}
		>
			<SignInContent />
		</Suspense>
	);
}
