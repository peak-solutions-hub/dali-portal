"use client";

import { useOnlineStatus } from "@repo/ui/hooks/use-online-status";
import { RefreshCw, WifiOff } from "lucide-react";
import { useCallback } from "react";

interface OnlineStatusBannerProps {
	/**
	 * Called when the user clicks "Retry".
	 * Defaults to `window.location.reload()`.
	 * Pass `router.refresh` from a client component for a soft refresh.
	 */
	onRetry?: () => void;
}

/**
 * Floating offline snackbar that appears at the bottom of the screen when the
 * browser loses network connectivity. Disappears automatically when connectivity
 * is restored. Includes a Retry button.
 *
 * @example
 * ```tsx
 * import { OnlineStatusBanner } from "@repo/ui/components/online-status-banner";
 *
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <>
 *       <OnlineStatusBanner />
 *       {children}
 *     </>
 *   );
 * }
 * ```
 */
export function OnlineStatusBanner({ onRetry }: OnlineStatusBannerProps = {}) {
	const isOnline = useOnlineStatus();

	const handleRetry = useCallback(() => {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	}, [onRetry]);

	if (isOnline) return null;

	return (
		<div
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
			className="fixed bottom-0 left-0 right-0 z-50 bg-[#0038A8] px-4 py-3 text-white shadow-[0_-2px_12px_rgba(0,0,0,0.15)]"
		>
			<div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
				<div className="flex min-w-0 items-center gap-3">
					<span
						className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20"
						aria-hidden="true"
					>
						<WifiOff className="size-4 text-white" aria-hidden="true" />
					</span>
					<div className="min-w-0">
						<p className="text-sm font-semibold leading-tight">
							You&apos;re offline
						</p>
						<p className="text-xs text-blue-200">
							Check your connection — content may not load.
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={handleRetry}
					aria-label="Retry loading the page"
					className="cursor-pointer flex shrink-0 items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[#0038A8] active:bg-white/40"
				>
					<RefreshCw className="size-3.5" aria-hidden="true" />
					Retry
				</button>
			</div>
		</div>
	);
}
