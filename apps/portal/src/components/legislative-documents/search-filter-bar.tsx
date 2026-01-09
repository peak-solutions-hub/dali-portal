"use client";

import {
	buildQueryString,
	CLASSIFICATION_TYPES,
	LEGISLATIVE_DOCUMENT_TYPES,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useDebounce } from "@repo/ui/hooks";
import { Search, X } from "@repo/ui/lib/lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface SearchFilterBarProps {
	availableYears: number[];
}

export function SearchFilterBar({ availableYears }: SearchFilterBarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const rawSearch = searchParams.get("search") || "";
	const selectedType = searchParams.get("type") || "all";
	const selectedYear = searchParams.get("year") || "all";
	const selectedClassification = searchParams.get("classification") || "all";

	const [searchInput, setSearchInput] = useState<string>(rawSearch);

	const debouncedSearch = useDebounce(searchInput, 400);

	const navigateWithParams = useCallback(
		(params: Record<string, string>) => {
			const baseParams = {
				search: searchParams.get("search") || "",
				type: searchParams.get("type") || "all",
				year: searchParams.get("year") || "all",
				classification: searchParams.get("classification") || "all",
				page: "1",
			};

			const newParams = { ...baseParams, ...params };
			const queryString = buildQueryString(newParams);
			router.push(`/legislative-documents?${queryString}`);
		},
		[searchParams, router],
	);

	const handleFilterChange = (key: string, value: string) => {
		navigateWithParams({ [key]: value });
	};

	const clearFilters = useCallback(() => {
		setSearchInput("");
		const queryString = buildQueryString({
			search: "",
			type: "all",
			year: "all",
			classification: "all",
			page: "1",
		});
		router.push(`/legislative-documents?${queryString}`);
	}, [router]);

	const hasActiveFilters =
		rawSearch !== "" ||
		selectedType !== "all" ||
		selectedYear !== "all" ||
		selectedClassification !== "all";

	useEffect(() => {
		if (debouncedSearch !== rawSearch) {
			navigateWithParams({ search: debouncedSearch });
		}
	}, [debouncedSearch, rawSearch, navigateWithParams]);

	return (
		<div
			className="sticky top-19 z-20 bg-gray-50 pt-6 pb-4 mb-0 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-gray-200"
			role="search"
			aria-label="Filter legislative documents"
		>
			<div className="container mx-auto flex flex-col md:flex-row gap-3 items-start md:items-center justify-between w-full">
				{/* Left: Search */}
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
						className="pl-9 h-10 bg-white"
						aria-label="Search legislative documents by title, number, or author"
					/>
				</div>

				{/* Right: Filters */}
				<div
					className="flex gap-3 items-center flex-wrap"
					role="group"
					aria-label="Document filters"
				>
					{/* Clear Filters Button */}
					{hasActiveFilters && (
						<Button
							variant="outline"
							size="sm"
							onClick={clearFilters}
							className="h-10 px-3 bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
							aria-label="Clear all filters"
						>
							<X className="w-4 h-4 mr-2" aria-hidden="true" />
							Clear Filters
						</Button>
					)}

					{/* Type Filter */}
					<Select
						value={selectedType}
						onValueChange={(value) => handleFilterChange("type", value)}
					>
						<SelectTrigger
							className="w-48 h-10 bg-white"
							aria-label="Filter by document type"
						>
							<SelectValue placeholder="All Types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{LEGISLATIVE_DOCUMENT_TYPES.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Year Filter */}
					<Select
						value={selectedYear}
						onValueChange={(value) => handleFilterChange("year", value)}
					>
						<SelectTrigger
							className="w-36 h-10 bg-white"
							aria-label="Filter by year"
						>
							<SelectValue placeholder="All Years" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Years</SelectItem>
							{availableYears.map((year) => (
								<SelectItem key={year} value={String(year)}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Classification Filter */}
					<Select
						value={selectedClassification}
						onValueChange={(value) =>
							handleFilterChange("classification", value)
						}
					>
						<SelectTrigger
							className="w-52 h-10 bg-white"
							aria-label="Filter by classification"
						>
							<SelectValue placeholder="All Classifications" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Classifications</SelectItem>
							{CLASSIFICATION_TYPES.map((classification) => (
								<SelectItem
									key={classification.value}
									value={classification.value}
								>
									{classification.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
