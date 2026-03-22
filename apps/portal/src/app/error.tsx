"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * Network-aware root error boundary for Next.js App Router.
 *
 * When a mid-stream network failure triggers this boundary (e.g. the SSR
 * stream is interrupted because the user went offline), we return `null` and
 * stay silent — `StreamGuard` and `OfflineAwareSuspense` are already handling
 * the offline UX. Surfacing an error UI here would cause a flash over their
 * offline fallback.
 *
 * When connectivity is restored, the `online` event listener calls `reset()`
 * which tells Next.js to attempt re-rendering the failed segment. The user
 * sees the page refresh automatically without having to click anything.
 *
 * Genuine application errors (non-network) still render a visible error UI so
 * developers and users know something went wrong.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
	const isOffline = isNetworkError(error);

	useEffect(() => {
		if (!isOffline) return;

		// When connectivity comes back, ask Next.js to re-render the segment.
		// SSR streams cannot resume, so a reset (which triggers a new request)
		// is the only way to recover.
		const handleOnline = () => reset();
		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [isOffline, reset]);

	// For network errors originating inside a page, error.tsx is the nearest
	// error boundary — StreamGuard (its parent) never sees these errors.
	// Render OfflineUI directly so the user gets the correct offline UX.
	// onRetry={reset} tells Next.js to re-render the segment when retried,
	// which matches what the `online` listener above does automatically.
	if (isOffline) return <OfflineUI onRetry={reset} />;

	// Real application error — surface it so it doesn't go unnoticed.
	return (
		<div className="flex w-full min-h-[calc(100svh-4.5rem)] sm:min-h-[calc(100svh-5rem)] flex-col items-center justify-center gap-5 bg-blue-50 p-6 sm:p-10 md:p-14 text-center">
			<span className="flex size-16 items-center justify-center rounded-full bg-[#0038A8]/10">
				<AlertCircle className="size-8 text-[#0038A8]" aria-hidden="true" />
			</span>
			<div className="space-y-1.5">
				<p className="text-base font-semibold text-gray-900">
					Something went wrong
				</p>
				<p className="text-sm text-gray-500">
					An unexpected error occurred. Please try again.
				</p>
			</div>
			<button
				type="button"
				onClick={reset}
				className="cursor-pointer flex items-center gap-2 rounded-lg bg-[#0038A8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0038A8] focus-visible:ring-offset-2 active:bg-[#002070]"
			>
				<RefreshCw className="size-4" aria-hidden="true" />
				Try again
			</button>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { OfflineUI } from "@repo/ui/components/offline-ui";
import { isNetworkError } from "@repo/ui/lib/is-network-error";
