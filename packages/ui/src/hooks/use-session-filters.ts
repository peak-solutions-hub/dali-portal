"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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
	const filters: SessionFilterValues = {
		types: searchParams.get("types")?.split(",").filter(Boolean) || [],
		statuses: searchParams.get("statuses")?.split(",").filter(Boolean) || [],
		dateFrom: searchParams.get("dateFrom") || null,
		dateTo: searchParams.get("dateTo") || null,
		sortOrder: (searchParams.get("sort") as "asc" | "desc") || "desc",
	};

	/**
	 * Update filters and sync with URL
	 */
	const updateFilters = useCallback(
		(updates: Partial<SessionFilterValues>) => {
			const params = new URLSearchParams(searchParams.toString());

			// Update types
			if (updates.types !== undefined) {
				if (updates.types.length > 0) {
					params.set("types", updates.types.join(","));
				} else {
					params.delete("types");
				}
			}

			// Update statuses
			if (updates.statuses !== undefined) {
				if (updates.statuses.length > 0) {
					params.set("statuses", updates.statuses.join(","));
				} else {
					params.delete("statuses");
				}
			}

			// Update date range
			if (updates.dateFrom !== undefined) {
				if (updates.dateFrom) {
					params.set("dateFrom", updates.dateFrom);
				} else {
					params.delete("dateFrom");
				}
			}

			if (updates.dateTo !== undefined) {
				if (updates.dateTo) {
					params.set("dateTo", updates.dateTo);
				} else {
					params.delete("dateTo");
				}
			}

			// Update sort order
			if (updates.sortOrder !== undefined) {
				params.set("sort", updates.sortOrder);
			}

			// Always set view to list and reset to page 1 when filters change
			params.set("view", "list");
			params.set("page", "1");

			router.push(`/sessions?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	/**
	 * Reset all filters to defaults
	 */
	const resetFilters = useCallback(() => {
		router.push("/sessions?view=list&page=1&sort=desc", { scroll: false });
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
