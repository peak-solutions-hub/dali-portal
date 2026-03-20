"use client";

import { useEffect } from "react";

/**
 * Forces scroll to top on mount.
 * Use in pages where client-side navigation should reset scroll position.
 */
export function ScrollToTop() {
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	return null;
}
