import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@repo/ui/components/pagination";

interface SessionPaginationProps {
	currentPage: number;
	totalPages: number;
	sortOrder: string;
	filterTypes: string[];
	filterStatuses: string[];
	filterDateFrom: string;
	filterDateTo: string;
}

function buildPaginationUrl(
	page: number,
	sortOrder: string,
	filterTypes: string[],
	filterStatuses: string[],
	filterDateFrom: string,
	filterDateTo: string,
) {
	const params = new URLSearchParams();
	params.set("view", "list");
	params.set("page", page.toString());
	params.set("sort", sortOrder);

	if (filterTypes.length > 0) {
		params.set("types", filterTypes.join(","));
	}

	if (filterStatuses.length > 0) {
		params.set("statuses", filterStatuses.join(","));
	}

	if (filterDateFrom) {
		params.set("dateFrom", filterDateFrom);
	}

	if (filterDateTo) {
		params.set("dateTo", filterDateTo);
	}

	return `/sessions?${params.toString()}`;
}

export function SessionPagination({
	currentPage,
	totalPages,
	sortOrder,
	filterTypes,
	filterStatuses,
	filterDateFrom,
	filterDateTo,
}: SessionPaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="mt-8 flex justify-center">
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href={buildPaginationUrl(
								currentPage - 1,
								sortOrder,
								filterTypes,
								filterStatuses,
								filterDateFrom,
								filterDateTo,
							)}
							aria-disabled={currentPage === 1}
							className={
								currentPage === 1 ? "pointer-events-none opacity-50" : ""
							}
						/>
					</PaginationItem>

					{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
						// Show first page, last page, current page, and pages around current
						const showPage =
							page === 1 ||
							page === totalPages ||
							Math.abs(page - currentPage) <= 1;

						if (!showPage) {
							// Show ellipsis for gaps
							if (page === currentPage - 2 || page === currentPage + 2) {
								return (
									<PaginationItem key={page}>
										<PaginationEllipsis />
									</PaginationItem>
								);
							}
							return null;
						}

						return (
							<PaginationItem key={page}>
								<PaginationLink
									href={buildPaginationUrl(
										page,
										sortOrder,
										filterTypes,
										filterStatuses,
										filterDateFrom,
										filterDateTo,
									)}
									isActive={page === currentPage}
								>
									{page}
								</PaginationLink>
							</PaginationItem>
						);
					})}

					<PaginationItem>
						<PaginationNext
							href={buildPaginationUrl(
								currentPage + 1,
								sortOrder,
								filterTypes,
								filterStatuses,
								filterDateFrom,
								filterDateTo,
							)}
							aria-disabled={currentPage === totalPages}
							className={
								currentPage === totalPages
									? "pointer-events-none opacity-50"
									: ""
							}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
