"use client";

import type { PaginationInfo } from "@repo/shared";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@repo/ui/components/pagination";

interface PaginationControlsProps {
	pagination: PaginationInfo;
	onPageChange: (page: number) => void;
}

export function PaginationControls({
	pagination,
	onPageChange,
}: PaginationControlsProps) {
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
			onPageChange(currentPage - 1);
		}
	};

	const handleNext = () => {
		if (hasNextPage) {
			onPageChange(currentPage + 1);
		}
	};

	return (
		<div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
			<span className="text-sm text-gray-700" aria-live="polite">
				Showing <span className="font-semibold">{startItem}</span>
				{endItem > startItem && (
					<>
						{" "}
						- <span className="font-semibold">{endItem}</span>
					</>
				)}{" "}
				of <span className="font-semibold">{totalItems}</span> tickets
			</span>

			<Pagination
				className="mx-0 w-auto"
				aria-label="Inquiry ticket pagination"
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
									onClick={() => onPageChange(1)}
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
								onClick={() => onPageChange(number)}
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
									onClick={() => onPageChange(totalPages)}
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
		</div>
	);
}
