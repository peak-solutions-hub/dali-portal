"use client";

import {
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useState,
} from "react";
import { useOnlineStatus } from "../../hooks/use-online-status";
import { OfflineUI } from "./offline-ui";

const DEFAULT_OFFLINE_ANNOUNCEMENT =
	"No internet connection. Check your connection and try again.";

// Initial delay before the first probe fires. 800 ms is intentionally short
// to catch Safari's unreliable navigator.onLine quickly (Safari frequently
// reports online when actually offline).
const PROBE_INITIAL_DELAY_MS = 800;

// Starting interval between probes. Grows exponentially up to PROBE_MAX_INTERVAL_MS.
const PROBE_INITIAL_INTERVAL_MS = 4_000;

// Upper bound for the backoff interval — no point probing less than once per 30s.
const PROBE_MAX_INTERVAL_MS = 30_000;

// How long to wait for a probe response before treating it as offline.
const PROBE_TIMEOUT_MS = 4_000;

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

	// While content is still loading, probe actual reachability with exponential
	// backoff. navigator.onLine / "offline" events are unreliable on iOS/macOS
	// Safari — a real fetch is the only reliable signal in those environments.
	//
	// Design decisions:
	// • Chained setTimeout (not setInterval) — avoids drift on backgrounded iOS
	//   tabs where setInterval callbacks are throttled unpredictably.
	// • Exponential backoff capped at PROBE_MAX_INTERVAL_MS — reduces unnecessary
	//   traffic on slow-but-stable connections and on serverless platforms where
	//   each invocation has a cost.
	// • Stop probing once offline is confirmed — once we know the user is offline
	//   there is nothing to gain from continued probing; we wait for the "online"
	//   event instead and re-probe once on reconnect.
	useEffect(() => {
		if (isCurrentlyResolved) return;

		let active = true;
		let scheduledId: ReturnType<typeof setTimeout> | undefined;

		const probe = async (nextInterval: number): Promise<void> => {
			if (!active) return;

			// Per-probe controller so the timeout abort is scoped to this invocation
			// and doesn't interfere with the active flag on unmount.
			const probeController = new AbortController();
			const timeoutId = setTimeout(
				() => probeController.abort(),
				PROBE_TIMEOUT_MS,
			);

			try {
				await fetch("/api/ping", {
					method: "GET",
					cache: "no-store",
					signal: probeController.signal,
				});
				clearTimeout(timeoutId);

				// Any HTTP response (even 4xx/5xx) means the network is reachable.
				// Only a thrown network-level error means the user is offline.
				if (active) {
					setProbeDetectedOffline(false);
					// Schedule the next probe with backoff.
					scheduledId = setTimeout(
						() => probe(Math.min(nextInterval * 1.5, PROBE_MAX_INTERVAL_MS)),
						nextInterval,
					);
				}
			} catch (err) {
				clearTimeout(timeoutId);

				if (err instanceof DOMException && err.name === "AbortError") {
					// A timeout abort means no connectivity or a severely degraded
					// connection — treat it as offline rather than silently swallowing
					// it and leaving the skeleton stuck indefinitely.
					if (active) setProbeDetectedOffline(true);
					// Stop probing — wait for the "online" event to trigger a retry
					// (handled by the auto-retry effect below).
					return;
				}

				if (active && err instanceof TypeError) {
					// TypeError is the signal for an actual network failure.
					// CORS errors, permission errors, etc. throw different types.
					setProbeDetectedOffline(true);
					// Stop probing once offline is confirmed — no value in continued
					// requests. The auto-retry effect re-arms when isOnline flips back.
					return;
				}

				// Any other error (unexpected) — schedule next probe normally so a
				// transient server-side error doesn't permanently stop the probe loop.
				if (active) {
					scheduledId = setTimeout(
						() => probe(Math.min(nextInterval * 1.5, PROBE_MAX_INTERVAL_MS)),
						nextInterval,
					);
				}
			}
		};

		// If already offline at mount time, probe immediately (delay = 0).
		// Otherwise wait PROBE_INITIAL_DELAY_MS to let fast connections resolve
		// before firing a probe at all.
		const initialDelay = isOnline ? PROBE_INITIAL_DELAY_MS : 0;
		scheduledId = setTimeout(
			() => probe(PROBE_INITIAL_INTERVAL_MS),
			initialDelay,
		);

		return () => {
			active = false;
			if (scheduledId !== undefined) clearTimeout(scheduledId);
			// No shared controller to abort — each probe manages its own
			// probeController. The active flag prevents state updates after unmount.
		};
	}, [isCurrentlyResolved, isOnline]);

	// When the browser fires the "online" event, isOnline flips true immediately.
	// Clear probeDetectedOffline right away so effectivelyOffline flips false
	// without waiting for the next probe round-trip (which would add at least
	// PROBE_INITIAL_DELAY_MS of unnecessary latency to reconnect recovery).
	useEffect(() => {
		if (isOnline) setProbeDetectedOffline(false);
	}, [isOnline]);

	const effectivelyOffline = !isOnline || probeDetectedOffline;

	// Track if connection dropped while content hadn't resolved yet.
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

	const defaultOfflineFallback = <OfflineUI onRetry={handleRetry} />;

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
