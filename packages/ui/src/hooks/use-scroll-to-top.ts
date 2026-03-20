"use client";

import { useCallback, useEffect, useState } from "react";

export interface UseScrollToTopReturn {
	/** Current vertical scroll position in pixels */
	scrollY: number;
	/** Smoothly scrolls the window back to the top */
	scrollToTop: () => void;
}

/**
 * Hook to track the current vertical scroll position and expose a smooth
 * scroll-to-top utility. Attaches a passive scroll listener and cleans up on unmount.
 *
 * @returns An object with the current `scrollY` value and a `scrollToTop` function
 *
 * @example
 * ```tsx
 * const { scrollY, scrollToTop } = useScrollToTop();
 *
 * return (
 *   <>
 *     {scrollY > 300 && (
 *       <button onClick={scrollToTop}>Back to top</button>
 *     )}
 *   </>
 * );
 * ```
 */
export function useScrollToTop(): UseScrollToTopReturn {
	const [scrollY, setScrollY] = useState<number>(0);

	useEffect(() => {
		// Sync real scroll position after hydration to avoid SSR mismatch
		setScrollY(window.scrollY);

		const handleScroll = () => setScrollY(window.scrollY);

		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const scrollToTop = useCallback(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	return { scrollY, scrollToTop };
}
