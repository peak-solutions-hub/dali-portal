"use client";

import type { PaginationInfo } from "@repo/shared";
import { buildQueryString } from "@repo/shared";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@repo/ui/components/pagination";
import { useRouter } from "next/navigation";

interface PaginationControlsProps {
	pagination: PaginationInfo;
	currentFilters: Record<string, string>;
}

export function PaginationControls({
	pagination,
	currentFilters,
}: PaginationControlsProps) {
	const router = useRouter();

	const handlePageChange = (newPage: number) => {
		const queryString = buildQueryString({
			...currentFilters,
			page: newPage.toString(),
		});
		router.push(`/legislative-documents?${queryString}`);
	};

	const {
		currentPage,
		totalPages,
		hasNextPage,
		hasPreviousPage,
		totalItems,
		itemsPerPage,
	} = pagination;

	// Calculate showing range (handle empty state)
	const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
	const endItem =
		totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);

	if (totalPages <= 1) {
		return null; // Don't show pagination if only one page or no items
	}

	// Calculate which page numbers to show
	const maxVisiblePages = 5;
	const halfVisible = Math.floor(maxVisiblePages / 2);

	// First page number to show based on the current page
	let startPage = Math.max(currentPage - halfVisible, 1);

	// Last page number to show
	const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

	if (endPage - startPage + 1 < maxVisiblePages) {
		startPage = Math.max(endPage - maxVisiblePages + 1, 1);
	}

	// All page numbers to show
	const pageNumbers = Array.from(
		{ length: endPage - startPage + 1 },
		(_, i) => startPage + i,
	);

	const handlePrevious = () => {
		if (hasPreviousPage) {
			handlePageChange(currentPage - 1);
		}
	};

	const handleNext = () => {
		if (hasNextPage) {
			handlePageChange(currentPage + 1);
		}
	};

	return (
		<div className="sticky top-38.5 z-20 bg-white py-3 px-4 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-gray-200 shadow-sm">
			<div className="container mx-auto px-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between w-full">
				<span className="text-sm text-gray-700" aria-live="polite">
					Showing <span className="font-semibold">{startItem}</span>-
					<span className="font-semibold">{endItem}</span> of{" "}
					<span className="font-semibold">{totalItems}</span> results
				</span>

				{totalPages > 1 && (
					<Pagination
						className="mx-0 w-auto justify-end"
						aria-label="Document list pagination"
					>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									onClick={handlePrevious}
									className={
										!hasPreviousPage
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
									aria-label="Go to previous page"
									aria-disabled={!hasPreviousPage}
								/>
							</PaginationItem>

							{startPage > 1 && (
								<>
									<PaginationItem>
										<PaginationLink
											onClick={() => handlePageChange(1)}
											isActive={currentPage === 1}
											className="cursor-pointer"
											aria-label="Go to first page"
										>
											1
										</PaginationLink>
									</PaginationItem>
									{startPage > 2 && (
										<PaginationItem>
											<PaginationEllipsis aria-hidden="true" />
										</PaginationItem>
									)}
								</>
							)}

							{pageNumbers.map((number) => (
								<PaginationItem key={number}>
									<PaginationLink
										onClick={() => handlePageChange(number)}
										isActive={currentPage === number}
										className="cursor-pointer"
										aria-label={`Go to page ${number}`}
										aria-current={currentPage === number ? "page" : undefined}
									>
										{number}
									</PaginationLink>
								</PaginationItem>
							))}

							{endPage < totalPages && (
								<>
									{endPage < totalPages - 1 && (
										<PaginationItem>
											<PaginationEllipsis aria-hidden="true" />
										</PaginationItem>
									)}
									<PaginationItem>
										<PaginationLink
											onClick={() => handlePageChange(totalPages)}
											isActive={currentPage === totalPages}
											className="cursor-pointer"
											aria-label={`Go to last page (page ${totalPages})`}
										>
											{totalPages}
										</PaginationLink>
									</PaginationItem>
								</>
							)}

							<PaginationItem>
								<PaginationNext
									onClick={handleNext}
									className={
										!hasNextPage
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
									aria-label="Go to next page"
									aria-disabled={!hasNextPage}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				)}
			</div>
		</div>
	);
}
