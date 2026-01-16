"use client";

import { buildSessionQueryString } from "@repo/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface SessionFilterValues {
	types: string[];
	statuses: string[];
	dateFrom: string | null;
	dateTo: string | null;
	sortOrder: "asc" | "desc";
}

export interface UseSessionFiltersReturn {
	filters: SessionFilterValues;
	updateFilters: (updates: Partial<SessionFilterValues>) => void;
	resetFilters: () => void;
	getFilterCount: () => number;
}

/**
 * Hook for managing session filter state via URL search params
 * Designed for use in Next.js App Router with client components
 */
export function useSessionFilters(): UseSessionFiltersReturn {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Parse current filters from URL
	const filters: SessionFilterValues = useMemo(
		() => ({
			types: searchParams.get("types")?.split(",").filter(Boolean) || [],
			statuses: searchParams.get("statuses")?.split(",").filter(Boolean) || [],
			dateFrom: searchParams.get("dateFrom") || null,
			dateTo: searchParams.get("dateTo") || null,
			sortOrder: (searchParams.get("sort") as "asc" | "desc") || "desc",
		}),
		[searchParams],
	);

	/**
	 * Update filters and sync with URL using buildSessionQueryString helper
	 */
	const updateFilters = useCallback(
		(updates: Partial<SessionFilterValues>) => {
			// Get current view or default to "list"
			const currentView = searchParams.get("view") || "list";

			// Build the new filter params
			const newParams: Record<string, string | number | undefined> = {
				view: currentView,
				page: 1, // Reset to page 1 when filters change
				sort: updates.sortOrder ?? filters.sortOrder,
			};

			// Update types (comma-separated or undefined)
			if (updates.types !== undefined) {
				newParams.types =
					updates.types.length > 0 ? updates.types.join(",") : undefined;
			} else if (filters.types.length > 0) {
				newParams.types = filters.types.join(",");
			}

			// Update statuses (comma-separated or undefined)
			if (updates.statuses !== undefined) {
				newParams.statuses =
					updates.statuses.length > 0 ? updates.statuses.join(",") : undefined;
			} else if (filters.statuses.length > 0) {
				newParams.statuses = filters.statuses.join(",");
			}

			// Update date range
			newParams.dateFrom = updates.dateFrom ?? filters.dateFrom ?? undefined;
			newParams.dateTo = updates.dateTo ?? filters.dateTo ?? undefined;

			const queryString = buildSessionQueryString(newParams);
			router.push(`/sessions?${queryString}`, { scroll: false });
		},
		[router, searchParams, filters],
	);

	/**
	 * Reset all filters to defaults using buildSessionQueryString
	 */
	const resetFilters = useCallback(() => {
		const queryString = buildSessionQueryString({
			view: "list",
			page: 1,
			sort: "desc",
		});
		router.push(`/sessions?${queryString}`, { scroll: false });
	}, [router]);

	/**
	 * Count active filters (excluding sort order)
	 */
	const getFilterCount = useCallback((): number => {
		let count = 0;
		if (filters.types.length > 0) count += filters.types.length;
		if (filters.statuses.length > 0) count += filters.statuses.length;
		if (filters.dateFrom) count += 1;
		if (filters.dateTo) count += 1;
		return count;
	}, [filters]);

	return {
		filters,
		updateFilters,
		resetFilters,
		getFilterCount,
	};
}
