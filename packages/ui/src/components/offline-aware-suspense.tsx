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

const DEFAULT_OFFLINE_ANNOUNCEMENT =
	"No internet connection. Check your connection and try again.";

interface OfflineAwareSuspenseProps {
	/** The async content to render — typically an async Server Component. */
	children: ReactNode;
	/** Shown while content is loading (skeleton / shimmer). */
	fallback: ReactNode;
	/** Overrides the built-in offline state card. */
	offlineFallback?: ReactNode;
	/**
	 * Text announced to screen readers when offline. Override this when
	 * providing a custom `offlineFallback` with different messaging so the
	 * visual content and SR announcement stay in sync.
	 * @default "No internet connection. Check your connection and try again."
	 */
	offlineAnnouncement?: string;
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
	offlineAnnouncement,
	onRetry,
}: OfflineAwareSuspenseProps) {
	const isOnline = useOnlineStatus();
	// isCurrentlyResolved reflects live suspension state — false while Suspense is
	// showing its fallback, true once children render. Using a two-way flag (vs a
	// one-way "ever resolved") lets the probe restart and offline detection re-arm
	// for subsequent re-suspension episodes (e.g. nested Suspense re-throws).
	const [isCurrentlyResolved, setIsCurrentlyResolved] = useState(false);
	const [wentOfflineDuringLoad, setWentOfflineDuringLoad] = useState(false);
	// Tracks reachability confirmed via fetch probe (catches Safari's unreliable
	// offline events and the "connected to WiFi but no internet" case).
	const [probeDetectedOffline, setProbeDetectedOffline] = useState(false);

	const handleRetry = useCallback(() => {
		// Reset stale flags before retrying so:
		// • a custom onRetry that doesn't reload doesn't immediately re-show the
		//   offline UI due to stale probeDetectedOffline state, and
		// • auto-retry only fires once per offline episode (wentOfflineDuringLoad
		//   becomes false, breaking the effect's condition on next render).
		setProbeDetectedOffline(false);
		setWentOfflineDuringLoad(false);
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	}, [onRetry]);

	const onResolved = useCallback(() => setIsCurrentlyResolved(true), []);
	const onSuspended = useCallback(() => {
		// Children re-suspended — begin a new loading episode. Reset so the probe
		// restarts and auto-retry can fire again if this suspension goes offline.
		setIsCurrentlyResolved(false);
		setWentOfflineDuringLoad(false);
	}, []);

	// While content is still loading, periodically probe actual reachability.
	// navigator.onLine / "offline" events are unreliable on iOS/macOS Safari —
	// a real HEAD request is the only reliable signal in those environments.
	useEffect(() => {
		if (isCurrentlyResolved) return;

		let active = true;
		let intervalId: ReturnType<typeof setInterval> | undefined;

		const probe = async () => {
			if (!active) return;
			// Per-probe controller so the 4s timeout abort doesn't interfere with
			// the active flag on unmount.
			const probeController = new AbortController();
			const timeout = setTimeout(() => probeController.abort(), 4000);
			try {
				await fetch("/favicon.ico", {
					method: "HEAD",
					cache: "no-store",
					signal: probeController.signal,
				});
				clearTimeout(timeout);
				// Any HTTP response (even 4xx/5xx) means the server is reachable —
				// the user is online. Only a network-level failure means offline.
				if (active) setProbeDetectedOffline(false);
			} catch (err) {
				clearTimeout(timeout);
				if (err instanceof DOMException && err.name === "AbortError") return;
				// TypeError is the signal for an actual network failure (no connectivity).
				// CORS errors, permission errors, etc. don't mean the user is offline.
				if (active && err instanceof TypeError) {
					setProbeDetectedOffline(true);
				}
			}
		};

		// Snapshot at effect setup time to decide initial delay.
		// Intentionally not inlined — documents that this is a one-time read,
		// not a reactive value.
		const initiallyOnline = isOnline;
		const delay = initiallyOnline ? 5000 : 0;

		const timeoutId = setTimeout(() => {
			probe();
			intervalId = setInterval(probe, 8000);
		}, delay);

		return () => {
			active = false;
			clearTimeout(timeoutId);
			if (intervalId !== undefined) clearInterval(intervalId);
			// No controller to abort — each probe manages its own via probeController.
			// The active flag prevents in-flight probes from updating state after unmount.
		};
	}, [isCurrentlyResolved, isOnline]);

	const effectivelyOffline = !isOnline || probeDetectedOffline;

	// Track if connection dropped while content hadn't resolved yet
	useEffect(() => {
		if (effectivelyOffline && !isCurrentlyResolved) {
			setWentOfflineDuringLoad(true);
		}
	}, [effectivelyOffline, isCurrentlyResolved]);

	// Auto-retry when back online after a mid-load connection drop.
	// The lost SSR stream can't be recovered without a new request.
	// handleRetry resets wentOfflineDuringLoad, so this fires at most once per
	// offline episode regardless of how many times effectivelyOffline oscillates.
	useEffect(() => {
		if (!effectivelyOffline && wentOfflineDuringLoad && !isCurrentlyResolved) {
			handleRetry();
		}
	}, [
		effectivelyOffline,
		wentOfflineDuringLoad,
		isCurrentlyResolved,
		handleRetry,
	]);

	const isOffline = effectivelyOffline && !isCurrentlyResolved;

	const defaultOfflineFallback = useMemo(
		() => (
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
		),
		[handleRetry],
	);

	return (
		<>
			{/*
			 * Always-mounted sr-only live region for screen reader announcements.
			 * Using sr-only (absolute, 1×1 px) instead of display:contents avoids
			 * a known browser bug where ARIA attributes are stripped from
			 * display:contents elements in older Chrome and Firefox.
			 */}
			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{isOffline
					? (offlineAnnouncement ?? DEFAULT_OFFLINE_ANNOUNCEMENT)
					: null}
			</div>
			{isOffline && (offlineFallback ?? defaultOfflineFallback)}
			{/*
			 * Unmount Suspense when offline. Keeping it mounted causes the in-flight
			 * SSR stream to throw a network error, which Next.js catches with the
			 * error boundary and flashes the error page over the offline card.
			 * SSR streams cannot resume after a network drop anyway, so unmounting
			 * has no cost and prevents the error boundary from firing.
			 */}
			{!isOffline && (
				<Suspense fallback={fallback}>
					<ResolvedSignal onResolved={onResolved} onSuspended={onSuspended}>
						{children}
					</ResolvedSignal>
				</Suspense>
			)}
		</>
	);
}

/**
 * Internal signal — fires `onResolved` once Suspense resolves so the parent
 * knows content has loaded and mid-flight offline detection can stop.
 */
function ResolvedSignal({
	children,
	onResolved,
	onSuspended,
}: {
	children: ReactNode;
	onResolved: () => void;
	onSuspended: () => void;
}) {
	useEffect(() => {
		onResolved();
		// Cleanup fires when Suspense re-shows the fallback (children re-suspended),
		// signalling the parent to restart the probe for the new loading episode.
		return onSuspended;
	}, [onResolved, onSuspended]);

	return <>{children}</>;
}
