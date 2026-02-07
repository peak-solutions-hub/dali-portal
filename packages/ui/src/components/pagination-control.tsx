import * as React from "react";
import { PaginationEngine } from "../lib/pagination-engine";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "./pagination";

export interface PaginationControlProps {
	totalItems: number;
	itemsPerPage: number;
	currentPage: number;

	// For CSR
	onPageChange?: (page: number) => void;

	// For SSR
	baseUrl?: string;
	searchParams?: Record<string, string | number | undefined>;

	className?: string;
	maxVisiblePages?: number;
	showCount?: boolean; // Option to show "Showing X-Y of Z" text
}

export function PaginationControl({
	totalItems,
	itemsPerPage,
	currentPage,
	onPageChange,
	baseUrl,
	searchParams,
	className,
	maxVisiblePages = 5,
	showCount = false,
}: PaginationControlProps) {
	const {
		pageNumbers,
		startPage,
		endPage,
		showStartEllipsis,
		showEndEllipsis,
		totalPages,
		startItem,
		endItem,
		hasPreviousPage,
		hasNextPage,
	} = React.useMemo(
		() =>
			PaginationEngine.calculate({
				currentPage,
				totalItems,
				itemsPerPage,
				maxVisiblePages,
			}),
		[currentPage, totalItems, itemsPerPage, maxVisiblePages],
	);

	if (totalPages <= 1) return null;

	const createHref = (page: number) => {
		if (!baseUrl) return undefined;
		const params = new URLSearchParams();
		if (searchParams) {
			Object.entries(searchParams).forEach(([key, value]) => {
				if (value !== undefined && value !== "") {
					params.set(key, String(value));
				}
			});
		}
		params.set("page", String(page));
		return `${baseUrl}?${params.toString()}`;
	};

	const handlePageChange = (page: number, e?: React.MouseEvent) => {
		if (onPageChange) {
			e?.preventDefault();
			onPageChange(page);
		}
	};

	return (
		<div
			className={`flex flex-col sm:flex-row items-center justify-between gap-4 w-full ${className}`}
		>
			{showCount && (
				<div className="text-sm text-muted-foreground">
					Showing{" "}
					<span className="font-medium text-foreground">{startItem} </span>
					{endItem > startItem ? (
						<>
							- <span className="font-medium text-foreground">{endItem}</span>
						</>
					) : null}{" "}
					of <span className="font-medium text-foreground">{totalItems}</span>{" "}
					results
				</div>
			)}

			<Pagination className={showCount ? "justify-end w-auto mx-0" : "mx-auto"}>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href={hasPreviousPage ? createHref(currentPage - 1) : undefined}
							onClick={
								hasPreviousPage && onPageChange
									? (e) => handlePageChange(currentPage - 1, e)
									: undefined
							}
							className={
								!hasPreviousPage
									? "pointer-events-none opacity-50"
									: "cursor-pointer"
							}
							aria-disabled={!hasPreviousPage}
						/>
					</PaginationItem>

					{showStartEllipsis && (
						<>
							<PaginationItem>
								<PaginationLink
									href={createHref(1)}
									onClick={
										onPageChange ? (e) => handlePageChange(1, e) : undefined
									}
									isActive={currentPage === 1}
								>
									1
								</PaginationLink>
							</PaginationItem>
							{startPage > 2 && (
								<PaginationItem>
									<PaginationEllipsis />
								</PaginationItem>
							)}
						</>
					)}

					{pageNumbers.map((number) => (
						<PaginationItem key={number}>
							<PaginationLink
								href={createHref(number)}
								onClick={
									onPageChange ? (e) => handlePageChange(number, e) : undefined
								}
								isActive={currentPage === number}
							>
								{number}
							</PaginationLink>
						</PaginationItem>
					))}

					{showEndEllipsis && (
						<>
							{endPage < totalPages - 1 && (
								<PaginationItem>
									<PaginationEllipsis />
								</PaginationItem>
							)}
							<PaginationItem>
								<PaginationLink
									href={createHref(totalPages)}
									onClick={
										onPageChange
											? (e) => handlePageChange(totalPages, e)
											: undefined
									}
									isActive={currentPage === totalPages}
								>
									{totalPages}
								</PaginationLink>
							</PaginationItem>
						</>
					)}

					<PaginationItem>
						<PaginationNext
							href={hasNextPage ? createHref(currentPage + 1) : undefined}
							onClick={
								hasNextPage && onPageChange
									? (e) => handlePageChange(currentPage + 1, e)
									: undefined
							}
							className={
								!hasNextPage
									? "pointer-events-none opacity-50"
									: "cursor-pointer"
							}
							aria-disabled={!hasNextPage}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
