"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import {
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useOnlineStatus } from "../hooks/use-online-status";

interface OfflineAwareSuspenseProps {
	/** The async content to render — typically an async Server Component. */
	children: ReactNode;
	/** Shown while content is loading (skeleton / shimmer). */
	fallback: ReactNode;
	/** Overrides the built-in offline state card. */
	offlineFallback?: ReactNode;
	/**
	 * Called when the user clicks Retry or when connectivity is restored mid-load.
	 * Defaults to `window.location.reload()`.
	 */
	onRetry?: () => void;
}

/**
 * A reusable Suspense wrapper that detects if the user goes offline during the
 * loading phase and replaces the skeleton with a styled offline fallback + retry
 * button, preventing an indefinitely stuck skeleton.
 *
 * When connectivity is restored mid-load, it auto-retries because the interrupted
 * SSR stream cannot be recovered without a new request.
 *
 * @example
 * ```tsx
 * import { OfflineAwareSuspense } from "@repo/ui/components/offline-aware-suspense";
 *
 * <OfflineAwareSuspense fallback={<MySkeleton />}>
 *   <MyAsyncContent />
 * </OfflineAwareSuspense>
 * ```
 */
export function OfflineAwareSuspense({
	children,
	fallback,
	offlineFallback,
	onRetry,
}: OfflineAwareSuspenseProps) {
	const isOnline = useOnlineStatus();
	const [hasResolved, setHasResolved] = useState(false);
	const [wentOfflineDuringLoad, setWentOfflineDuringLoad] = useState(false);

	const handleRetry = useCallback(() => {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	}, [onRetry]);

	const onResolved = useCallback(() => setHasResolved(true), []);

	// Track if connection dropped while content hadn't resolved yet
	useEffect(() => {
		if (!isOnline && !hasResolved) {
			setWentOfflineDuringLoad(true);
		}
	}, [isOnline, hasResolved]);

	// Auto-retry when back online after a mid-load connection drop.
	// The lost SSR stream can't be recovered without a new request.
	useEffect(() => {
		if (isOnline && wentOfflineDuringLoad && !hasResolved) {
			handleRetry();
		}
	}, [isOnline, wentOfflineDuringLoad, hasResolved, handleRetry]);

	const defaultOfflineFallback = useMemo(
		() => (
			<div
				role="status"
				aria-label="No internet connection"
				className="flex w-full min-in-h-[calc(100svh-6rem)] flex-col items-center justify-center gap-5 bg-blue-50 p-6 sm:p-10 md:p-14 text-center"
			>
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
		),
		[handleRetry],
	);

	if (!isOnline && !hasResolved) {
		return <>{offlineFallback ?? defaultOfflineFallback}</>;
	}

	return (
		<Suspense fallback={fallback}>
			<ResolvedSignal onResolved={onResolved}>{children}</ResolvedSignal>
		</Suspense>
	);
}

/**
 * Internal signal — fires `onResolved` once Suspense resolves so the parent
 * knows content has loaded and mid-flight offline detection can stop.
 */
function ResolvedSignal({
	children,
	onResolved,
}: {
	children: ReactNode;
	onResolved: () => void;
}) {
	useEffect(() => {
		onResolved();
	}, [onResolved]);

	return <>{children}</>;
}
