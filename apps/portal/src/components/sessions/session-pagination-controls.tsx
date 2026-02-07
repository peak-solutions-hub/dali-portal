"use client";

import {
	buildSessionQueryString,
	type SessionPaginationInfo,
} from "@repo/shared";
import { PaginationControl } from "@repo/ui/components/pagination-control";
import { useRouter } from "next/navigation";

interface SessionPaginationControlsProps {
	pagination: SessionPaginationInfo;
	currentFilters: {
		types?: string;
		statuses?: string;
		dateFrom?: string;
		dateTo?: string;
		sort?: string;
	};
}

export function SessionPaginationControls({
	pagination,
	currentFilters,
}: SessionPaginationControlsProps) {
	const router = useRouter();

	const handlePageChange = (newPage: number) => {
		const queryString = buildSessionQueryString({
			view: "list",
			page: newPage,
			...currentFilters,
		});
		router.push(`/sessions?${queryString}`);
	};

	const { currentPage, totalCount, itemsPerPage } = pagination;

	return (
		<PaginationControl
			totalItems={totalCount}
			itemsPerPage={itemsPerPage}
			currentPage={currentPage}
			onPageChange={handlePageChange}
			baseUrl="/sessions"
			searchParams={{ ...currentFilters, view: "list" }}
			showCount
			className="sticky bottom-0 left-0 right-0 xl:sticky xl:top-62 xl:bottom-auto z-20 bg-white py-3 px-4 mb-0 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-t xl:border-t-0 xl:border-b border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] xl:shadow-sm"
		/>
	);
}
