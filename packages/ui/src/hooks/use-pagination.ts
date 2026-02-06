import { useMemo } from "react";

interface UsePaginationOptions<T = unknown> {
	currentPage: number;
	/**
	 * Either provide `totalPages` (existing behavior) or provide
	 * `totalItems` + `itemsPerPage` (recommended for pages that work with item lists).
	 */
	totalPages?: number;
	totalItems?: number;
	itemsPerPage?: number;
	/** Optional: if provided the hook will return a typed `paginatedItems` slice */
	items?: T[];
	maxVisiblePages?: number;
}

interface UsePaginationReturn<T = unknown> {
	pageNumbers: number[];
	startPage: number;
	endPage: number;
	showStartEllipsis: boolean;
	showEndEllipsis: boolean;

	// Additional convenience values
	totalPages: number;
	startIndex: number;
	endIndex: number;
	startItem: number;
	endItem: number;

	// Optional typed slice if `items` passed in options
	paginatedItems?: T[];
}

/**
 * Custom hook for pagination logic
 * Calculates which page numbers to display with ellipsis
 */
export function usePagination<T = unknown>({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	items,
	maxVisiblePages = 5,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
	return useMemo(() => {
		// Compute totalPages if totalItems + itemsPerPage are provided
		const computedTotalPages =
			totalPages !== undefined
				? totalPages
				: itemsPerPage && totalItems
					? Math.max(1, Math.ceil(totalItems / itemsPerPage))
					: 0;

		const halfVisible = Math.floor(maxVisiblePages / 2);
		let startPage = Math.max(currentPage - halfVisible, 1);
		const endPage = Math.min(
			startPage + maxVisiblePages - 1,
			computedTotalPages,
		);

		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(endPage - maxVisiblePages + 1, 1);
		}

		const pageNumbers = Array.from(
			{ length: Math.max(0, endPage - startPage + 1) },
			(_, i) => startPage + i,
		);

		const showStartEllipsis = startPage > 1;
		const showEndEllipsis = endPage < computedTotalPages;

		// Compute index/offset and display item counts when itemsPerPage & totalItems provided
		const startIndex = itemsPerPage ? (currentPage - 1) * itemsPerPage : 0;
		const endIndex = itemsPerPage ? startIndex + itemsPerPage : 0;
		const startItem =
			totalItems === 0 || totalItems === undefined ? 0 : startIndex + 1;
		const endItem =
			itemsPerPage && totalItems
				? Math.min(currentPage * itemsPerPage, totalItems)
				: 0;

		// Optional typed slice when `items` array provided
		const paginatedItems =
			items && itemsPerPage
				? items.slice(startIndex, Math.min(items.length, endIndex))
				: undefined;

		return {
			pageNumbers,
			startPage,
			endPage,
			showStartEllipsis,
			showEndEllipsis,

			totalPages: computedTotalPages,
			startIndex,
			endIndex,
			startItem,
			endItem,
			paginatedItems,
		};
	}, [
		currentPage,
		totalPages,
		totalItems,
		itemsPerPage,
		items,
		maxVisiblePages,
	]);
}
