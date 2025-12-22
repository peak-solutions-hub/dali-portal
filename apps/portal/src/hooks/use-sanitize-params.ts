"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface SanitizeConfig {
	/**
	 * The current raw parameter values from URL
	 */
	rawParams: Record<string, string>;
	/**
	 * The sanitized/validated parameter values
	 */
	sanitizedParams: Record<string, string>;
	/**
	 * Function to build the query string from params
	 */
	buildQuery: (params: Record<string, string>) => string;
	/**
	 * The base path to redirect to (e.g., '/legislative-documents')
	 */
	basePath: string;
}

/**
 * Hook to sanitize URL parameters and replace invalid ones
 * Useful for preventing blank select inputs when URL contains invalid filter values
 *
 * @param config - Configuration object for sanitization
 */
export function useSanitizeParams(config: SanitizeConfig): void {
	const router = useRouter();
	const { rawParams, sanitizedParams, buildQuery, basePath } = config;

	useEffect(() => {
		// Check if any raw params differ from sanitized versions
		const needsSanitization = Object.keys(rawParams).some(
			(key) => rawParams[key] !== sanitizedParams[key],
		);

		if (needsSanitization) {
			// Build query string with sanitized params
			const queryString = buildQuery(sanitizedParams);
			// Replace URL to avoid blank selects
			router.replace(`${basePath}?${queryString}`);
		}
		// Only run on mount - empty dependency array prevents infinite loops
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
