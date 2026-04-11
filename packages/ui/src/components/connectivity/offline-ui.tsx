"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useCallback } from "react";

interface OfflineUIProps {
	/**
	 * Called when the user clicks "Try again".
	 * Defaults to `window.location.reload()`.
	 */
	onRetry?: () => void;
}

/**
 * Full-page offline fallback UI. Shared between `OfflineAwareSuspense` and
 * `StreamGuard` so the design stays in sync across both offline interception
 * layers.
 *
 * @example
 * ```tsx
 * import { OfflineUI } from "@repo/ui/components/offline-ui";
 *
 * <StreamGuard fallback={<OfflineUI />}>
 *   {children}
 * </StreamGuard>
 * ```
 */
export function OfflineUI({ onRetry }: OfflineUIProps = {}) {
	const handleRetry = useCallback(() => {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	}, [onRetry]);

	return (
		<div className="flex w-full min-h-[calc(100svh-4.5rem)] sm:min-h-[calc(100svh-5rem)] flex-col items-center justify-center gap-5 bg-blue-50 p-6 sm:p-10 md:p-14 text-center">
			<span className="flex size-16 items-center justify-center rounded-full bg-[#0038A8]/10">
				<WifiOff className="size-8 text-[#0038A8]" aria-hidden="true" />
			</span>
			<div className="space-y-1.5">
				<p className="text-base font-semibold text-gray-900">
					No internet connection
				</p>
				<p className="text-sm text-gray-500">
					The page couldn&apos;t load. Check your connection and try again.
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
	);
}
