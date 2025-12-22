"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if the viewport is mobile-sized
 * @param breakpoint - The maximum width (in pixels) to be considered mobile (default: 1024)
 * @returns boolean indicating if the viewport is mobile-sized
 */
export function useMobile(breakpoint = 1024): boolean {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < breakpoint);
		};

		// Check on mount
		checkMobile();

		// Add resize listener
		window.addEventListener("resize", checkMobile);

		// Cleanup
		return () => window.removeEventListener("resize", checkMobile);
	}, [breakpoint]);

	return isMobile;
}
