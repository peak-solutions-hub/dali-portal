"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile-sized
 * Uses window.matchMedia for efficient resize detection
 *
 * @returns true if viewport width is less than 768px, false otherwise
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 *
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 * ```
 */
export function useIsMobile(): boolean {
	const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};

		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

		return () => mql.removeEventListener("change", onChange);
	}, []);

	return !!isMobile;
}
