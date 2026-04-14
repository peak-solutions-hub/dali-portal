"use client";

import { Button } from "@repo/ui/components/button";
import { isNetworkError } from "@repo/ui/lib/is-network-error";
import { AlertCircle, RefreshCw, WifiOff } from "@repo/ui/lib/lucide-react";
import { useEffect } from "react";

interface SessionManagementErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function SessionManagementError({
	error,
	reset,
}: SessionManagementErrorProps) {
	useEffect(() => {
		console.error("Session management route error:", error);
	}, [error]);

	const networkError = isNetworkError(error);
	const StatusIcon = networkError ? WifiOff : AlertCircle;
	const visual = networkError
		? {
				cardBg: "bg-white",
				cardBorder: "border-blue-200",
				iconBg: "bg-blue-100",
				iconColor: "text-blue-700",
				badge: "bg-blue-100 text-blue-800",
				label: "Network Runtime Error",
				button: "border-blue-300 text-blue-800 hover:bg-blue-100",
			}
		: {
				cardBg: "bg-white",
				cardBorder: "border-red-200",
				iconBg: "bg-red-100",
				iconColor: "text-red-700",
				badge: "bg-red-100 text-red-800",
				label: "Application Runtime Error",
				button: "border-red-300 text-red-800 hover:bg-red-100",
			};
	const title = networkError
		? "Connection issue while loading Session Management"
		: "Something went wrong in Session Management";
	const description = networkError
		? "We could not reach the server. Please check your network and try again."
		: "An unexpected client or API error occurred. Please retry. If this continues, contact support.";

	return (
		<div className="flex h-full min-h-[60vh] items-center justify-center bg-[#f9fafb] px-6 py-8">
			<div
				className={`w-full max-w-2xl rounded-xl border p-6 shadow-sm ${visual.cardBorder} ${visual.cardBg}`}
			>
				<div className="mb-5 flex items-start gap-3">
					<span
						className={`mt-0.5 rounded-full p-2.5 ${visual.iconBg}`}
						aria-hidden="true"
					>
						<StatusIcon className={`h-5 w-5 ${visual.iconColor}`} />
					</span>
					<div className="min-w-0">
						<div className="mb-1 flex flex-wrap items-center gap-2">
							<h2 className="text-base font-semibold text-gray-900">{title}</h2>
							<span
								className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${visual.badge}`}
							>
								{visual.label}
							</span>
						</div>
						<p className="text-sm leading-relaxed text-gray-700">
							{description}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-center border-t border-gray-200 pt-4">
					<Button
						variant="outline"
						size="sm"
						onClick={reset}
						className={`cursor-pointer ${visual.button}`}
					>
						<RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
						Reload Session Management
					</Button>
				</div>
			</div>
		</div>
	);
}
