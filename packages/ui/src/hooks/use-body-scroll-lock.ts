"use client";

import { useEffect } from "react";

/**
 * Hook to lock body scroll when active (e.g., when a modal is open)
 * Prevents page scrolling while a modal or overlay is visible
 *
 * @param isLocked - Whether the body scroll should be locked
 */
export function useBodyScrollLock(isLocked: boolean): void {
	useEffect(() => {
		if (isLocked) {
			// Store original overflow value
			const originalOverflow = document.body.style.overflow;

			// Lock scroll
			document.body.style.overflow = "hidden";

			// Cleanup: restore original overflow
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isLocked]);
}
