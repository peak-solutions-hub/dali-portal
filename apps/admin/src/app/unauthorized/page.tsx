"use client";

import { Button } from "@repo/ui/components/button";
import {
	AlertTriangle,
	ArrowLeft,
	LogOut,
	ShieldOff,
} from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Unauthorized page displayed when a user attempts to access
 * a resource they don't have permission to view.
 *
 * This handles 401 Unauthorized errors and provides options to:
 * - Go back to the previous page
 * - Return to dashboard
 * - Sign out and log in with different credentials
 */
export default function UnauthorizedPage() {
	const router = useRouter();
	const { logout, userProfile } = useAuthStore();

	const handleSignOut = async () => {
		await logout();
		router.push("/auth/sign-in");
	};

	return (
		<AuthCard>
			{/* Icon */}
			<div className="flex justify-center mb-6">
				<div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
					<ShieldOff className="w-10 h-10 text-[#a60202]" />
				</div>
			</div>

			{/* Title */}
			<h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
				Access Denied
			</h1>

			{/* Description */}
			<p className="text-center text-gray-600 mb-6">
				You don&apos;t have permission to access this page.
				{userProfile?.role?.name && (
					<span className="block mt-1 text-sm">
						Your current role:{" "}
						<span className="font-semibold capitalize">
							{userProfile.role.name.replace(/_/g, " ")}
						</span>
					</span>
				)}
			</p>

			{/* Alert */}
			<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
				<div className="flex items-start gap-3">
					<AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					<div className="text-sm text-amber-800">
						<p className="font-medium mb-1">Why am I seeing this?</p>
						<p className="text-amber-700">
							This page requires elevated permissions. If you believe you should
							have access, please contact your system administrator.
						</p>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="space-y-3">
				<Button
					onClick={() => router.back()}
					variant="outline"
					className="w-full h-11 border-gray-300 hover:bg-gray-50"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Go Back
				</Button>

				<Button
					onClick={() => router.push("/dashboard")}
					className="w-full h-11 bg-[#a60202] hover:bg-[#8a0101] text-white"
				>
					Return to Dashboard
				</Button>

				<Button
					onClick={handleSignOut}
					variant="ghost"
					className="w-full h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
				>
					<LogOut className="w-4 h-4 mr-2" />
					Sign Out & Use Different Account
				</Button>
			</div>

			{/* Help text */}
			<p className="text-center text-xs text-gray-500 mt-6">
				Need help? Contact IT support at{" "}
				<a
					href="mailto:support@iloilocity.gov.ph"
					className="text-[#a60202] hover:underline"
				>
					support@iloilocity.gov.ph
				</a>
			</p>
		</AuthCard>
	);
}
