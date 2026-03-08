"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
	window.addEventListener("online", callback);
	window.addEventListener("offline", callback);
	return () => {
		window.removeEventListener("online", callback);
		window.removeEventListener("offline", callback);
	};
}

/**
 * Hook to reactively track the browser's network connectivity status.
 * Listens to the `online` and `offline` window events and cleans up on unmount.
 *
 * Uses `useSyncExternalStore` so the server snapshot (`true`) matches the SSR
 * output, avoiding hydration mismatches even when the client is offline.
 *
 * @returns `true` when the browser is online, `false` when offline
 *
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 *
 * return isOnline ? <p>Connected</p> : <p>No internet connection</p>;
 * ```
 */
export function useOnlineStatus(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => navigator.onLine,
		() => true,
	);
}
