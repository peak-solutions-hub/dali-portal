"use client";

import { useEffect, useState } from "react";

/**
 * Hook to reactively track the browser's network connectivity status.
 * Listens to the `online` and `offline` window events and cleans up on unmount.
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
	const [isOnline, setIsOnline] = useState<boolean>(
		typeof navigator !== "undefined" ? navigator.onLine : true,
	);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return isOnline;
}
