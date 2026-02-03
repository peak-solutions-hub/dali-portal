"use client";

import { Input } from "@repo/ui/components/input";
import { useDebounce } from "@repo/ui/hooks";
import { Search, X } from "@repo/ui/lib/lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { FilterControls } from "./filter-controls";

interface SearchFilterBarProps {
	availableYears: number[];
}

export function SearchFilterBar({ availableYears }: SearchFilterBarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	// Only track the search value from URL
	const currentSearch = useMemo(
		() => searchParams.get("search") || "",
		[searchParams],
	);

	const [searchInput, setSearchInput] = useState<string>(currentSearch);

	const debouncedSearch = useDebounce(searchInput, 400);

	// Sync input with URL when URL changes externally (e.g., back button, direct navigation)
	useEffect(() => {
		setSearchInput(currentSearch);
	}, [currentSearch]);

	useEffect(() => {
		// Read current URL search at execution time to avoid stale closure
		const urlSearch =
			new URLSearchParams(window.location.search).get("search") || "";

		if (debouncedSearch !== urlSearch) {
			// Preserve all existing params, only update search and reset to page 1
			const newParams = new URLSearchParams(window.location.search);

			if (debouncedSearch) {
				newParams.set("search", debouncedSearch);
			} else {
				newParams.delete("search");
			}
			newParams.set("page", "1");

			startTransition(() => {
				router.push(`/legislative-documents?${newParams.toString()}`);
			});
		}
	}, [debouncedSearch, router]);

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
						disabled={isPending}
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
