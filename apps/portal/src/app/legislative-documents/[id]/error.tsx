"use client";

import { useOnlineStatus } from "@repo/ui/hooks/use-online-status";
import { ChevronLeft, RefreshCw, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
	const isOnline = useOnlineStatus();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		console.error("Legislative document detail route error:", error);
	}, [error]);

	const handleRetry = () => {
		if (isOnline) {
			// Use startTransition to trigger a proper re-render
			startTransition(() => {
				router.refresh();
				reset();
			});
			return;
		}

		window.location.reload();
	};

	const handleBack = () => {
		startTransition(() => {
			router.push("/legislative-documents");
		});
	};

	return (
		<div className="min-h-[calc(100svh-4.5rem)] sm:min-h-[calc(100svh-5rem)] bg-blue-50 p-6 sm:p-10 md:p-14">
			<div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
				<span className="flex size-16 items-center justify-center rounded-full bg-[#0038A8]/10">
					<WifiOff className="size-8 text-[#0038A8]" aria-hidden="true" />
				</span>

				<div className="space-y-1.5">
					<p className="text-base font-semibold text-gray-900">
						{isOnline ? "Unable to load document" : "No internet connection"}
					</p>
					<p className="text-sm text-gray-500">
						{isOnline
							? "The document page could not be loaded right now. Please try again."
							: "The document page could not finish loading while offline. Reconnect and try again."}
					</p>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row">
					<button
						type="button"
						onClick={handleRetry}
						disabled={isPending}
						className="cursor-pointer flex items-center justify-center gap-2 rounded-lg bg-[#0038A8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0038A8] focus-visible:ring-offset-2 active:bg-[#002070] disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<RefreshCw
							className={`size-4 ${isPending ? "animate-spin" : ""}`}
							aria-hidden="true"
						/>
						{isPending ? "Retrying..." : "Try again"}
					</button>

					<button
						type="button"
						onClick={handleBack}
						disabled={isPending}
						className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#0038A8] px-5 py-2.5 text-sm font-semibold text-[#0038A8] hover:bg-[#0038A8]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0038A8] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<ChevronLeft className="size-4" aria-hidden="true" />
						Back to documents
					</button>
				</div>
			</div>
		</div>
	);
}
