import { Loader2 } from "@repo/ui/lib/lucide-react";
import { Suspense } from "react";
import { AuthCard, LoginForm } from "@/components/auth";

export default function SignInPage() {
	return (
		<Suspense
			fallback={
				<AuthCard>
					<div className="flex flex-col items-center justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-[#a60202] mb-4" />
						<p className="text-gray-600 text-sm">Loading...</p>
					</div>
				</AuthCard>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
