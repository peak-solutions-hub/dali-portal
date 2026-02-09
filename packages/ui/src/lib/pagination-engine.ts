export interface PaginationOptions {
	currentPage: number;
	totalPages?: number;
	totalItems?: number;
	itemsPerPage?: number;
	maxVisiblePages?: number;
}

export interface PaginationResult {
	pageNumbers: number[];
	startPage: number;
	endPage: number;
	showStartEllipsis: boolean;
	showEndEllipsis: boolean;
	totalPages: number;
	startIndex: number;
	endIndex: number;
	startItem: number;
	endItem: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}

export class PaginationEngine {
	public static parseOptions(
		options: Partial<PaginationOptions>,
	): PaginationOptions {
		return {
			currentPage: Math.max(1, Number(options.currentPage || 1)),
			totalPages: options.totalPages
				? Math.max(0, Number(options.totalPages))
				: undefined,
			totalItems: options.totalItems
				? Math.max(0, Number(options.totalItems))
				: undefined,
			itemsPerPage: options.itemsPerPage
				? Math.max(1, Number(options.itemsPerPage))
				: undefined,
			maxVisiblePages: Math.max(1, Number(options.maxVisiblePages || 5)),
		};
	}

	public static calculate(options: PaginationOptions): PaginationResult {
		const {
			currentPage,
			totalPages,
			totalItems,
			itemsPerPage,
			maxVisiblePages = 5,
		} = options;

		// Compute totalPages if totalItems + itemsPerPage are provided
		const computedTotalPages =
			totalPages !== undefined
				? totalPages
				: itemsPerPage && totalItems !== undefined
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
		const endIndex = itemsPerPage
			? Math.min(startIndex + itemsPerPage, totalItems || 0)
			: 0;

		const startItem =
			totalItems === 0 || totalItems === undefined ? 0 : startIndex + 1;

		// Ensure endItem doesn't exceed totalItems
		const endItem =
			itemsPerPage && totalItems !== undefined
				? Math.min(currentPage * itemsPerPage, totalItems)
				: 0;

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
			hasPreviousPage: currentPage > 1,
			hasNextPage: currentPage < computedTotalPages,
		};
	}
}
