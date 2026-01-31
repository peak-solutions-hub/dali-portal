"use client";

import { buildQueryString } from "@repo/shared";
import { Input } from "@repo/ui/components/input";
import { useDebounce } from "@repo/ui/hooks";
import { Search, X } from "@repo/ui/lib/lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterControls } from "./filter-controls";

interface SearchFilterBarProps {
	availableYears: number[];
}

export function SearchFilterBar({ availableYears }: SearchFilterBarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const currentParams = useMemo(
		() => ({
			search: searchParams.get("search") || "",
			type: searchParams.get("type") || "all",
			year: searchParams.get("year") || "all",
			classification: searchParams.get("classification") || "all",
		}),
		[searchParams],
	);

	const [searchInput, setSearchInput] = useState<string>(currentParams.search);

	const debouncedSearch = useDebounce(searchInput, 400);

	const navigateWithParams = useCallback(
		(params: Record<string, string>) => {
			const newParams = {
				...currentParams,
				...params,
				page: "1", // Reset to page 1 when filters change
			};
			const queryString = buildQueryString(newParams);
			router.push(`/legislative-documents?${queryString}`);
		},
		[currentParams, router],
	);

	useEffect(() => {
		if (debouncedSearch !== currentParams.search) {
			navigateWithParams({ search: debouncedSearch });
		}
	}, [debouncedSearch, currentParams.search, navigateWithParams]);

	return (
		<div
			className="flex flex-col gap-3 w-full"
			role="search"
			aria-label="Filter legislative documents"
		>
			<div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full">
				<div className="relative w-full md:w-80">
					<Search
						className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
						aria-hidden="true"
					/>
					<Input
						placeholder="Search documents..."
						value={searchInput}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setSearchInput(e.target.value)
						}
						className="pl-9 pr-9 h-10 bg-white border-gray-300"
						aria-label="Search legislative documents by title, number, or author"
						maxLength={200}
					/>
					{searchInput && (
						<button
							type="button"
							onClick={() => setSearchInput("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
							aria-label="Clear search"
						>
							<X className="w-4 h-4" aria-hidden="true" />
						</button>
					)}
				</div>
				<FilterControls availableYears={availableYears} />
			</div>
		</div>
	);
}
