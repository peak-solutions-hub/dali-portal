import type { PaginationInfo } from "@repo/shared";
import { PaginationControl } from "@repo/ui/components/pagination-control";

interface PaginationControlsProps {
	pagination: PaginationInfo;
	currentFilters: Record<string, string>;
}

export function PaginationControls({
	pagination,
	currentFilters,
}: PaginationControlsProps) {
	const { currentPage, totalItems, itemsPerPage } = pagination;

	return (
		<PaginationControl
			totalItems={totalItems}
			itemsPerPage={itemsPerPage}
			currentPage={currentPage}
			baseUrl="/legislative-documents"
			searchParams={currentFilters}
			showCount
			className="sticky bottom-0 left-0 right-0 xl:sticky xl:top-38.5 xl:bottom-auto z-20 bg-white py-3 px-4 mb-0 border-t xl:border-t-0 xl:border-b border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] xl:shadow-sm"
		/>
	);
}
