"use client";

import { useOnlineStatus } from "@repo/ui/hooks/use-online-status";
import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect } from "react";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
	const isOnline = useOnlineStatus();

	useEffect(() => {
		console.error("Legislative documents route error:", error);
	}, [error]);

	const handleRetry = () => {
		if (isOnline) {
			reset();
			return;
		}

		window.location.reload();
	};

	return (
		<div className="min-h-[calc(100svh-4.5rem)] sm:min-h-[calc(100svh-5rem)] bg-blue-50 p-6 sm:p-10 md:p-14">
			<div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
				<span className="flex size-16 items-center justify-center rounded-full bg-[#0038A8]/10">
					<WifiOff className="size-8 text-[#0038A8]" aria-hidden="true" />
				</span>

				<div className="space-y-1.5">
					<p className="text-base font-semibold text-gray-900">
						{isOnline ? "Something went wrong" : "No internet connection"}
					</p>
					<p className="text-sm text-gray-500">
						{isOnline
							? "The page could not be loaded. Please try again."
							: "The page could not finish loading while offline. Reconnect and try again."}
					</p>
				</div>

				<button
					type="button"
					onClick={handleRetry}
					className="cursor-pointer flex items-center gap-2 rounded-lg bg-[#0038A8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0038A8] focus-visible:ring-offset-2 active:bg-[#002070]"
				>
					<RefreshCw className="size-4" aria-hidden="true" />
					Try again
				</button>
			</div>
		</div>
	);
}
