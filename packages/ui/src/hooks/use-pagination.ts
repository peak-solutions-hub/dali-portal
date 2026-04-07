import {
	PaginationEngine,
	type PaginationResult,
} from "@repo/ui/lib/pagination-engine";
import { useEffect, useMemo, useState } from "react";

interface UsePaginationOptions<T> {
	items: T[];
	itemsPerPage?: number;
	initialPage?: number;
}

interface UsePaginationResult<T> {
	currentPage: number;
	setCurrentPage: (page: number) => void;
	paginatedItems: T[];
	pagination: PaginationResult;
}

export function usePagination<T>({
	items,
	itemsPerPage = 10,
	initialPage = 1,
}: UsePaginationOptions<T>): UsePaginationResult<T> {
	const [currentPage, setCurrentPageState] = useState(initialPage);

	const pagination = useMemo(
		() =>
			PaginationEngine.calculate({
				currentPage,
				totalItems: items.length,
				itemsPerPage,
			}),
		[currentPage, items.length, itemsPerPage],
	);

	useEffect(() => {
		if (pagination.totalPages === 0 && currentPage !== 1) {
			setCurrentPageState(1);
			return;
		}

		if (pagination.totalPages > 0 && currentPage > pagination.totalPages) {
			setCurrentPageState(pagination.totalPages);
		}
	}, [currentPage, pagination.totalPages]);

	const paginatedItems = useMemo(
		() => items.slice(pagination.startIndex, pagination.endIndex),
		[items, pagination.startIndex, pagination.endIndex],
	);

	const setCurrentPage = (page: number) => {
		if (!Number.isFinite(page)) {
			return;
		}

		if (pagination.totalPages === 0) {
			setCurrentPageState(1);
			return;
		}

		const nextPage = Math.min(
			Math.max(1, Math.trunc(page)),
			pagination.totalPages,
		);
		setCurrentPageState(nextPage);
	};

	return {
		currentPage,
		setCurrentPage,
		paginatedItems,
		pagination,
	};
}
