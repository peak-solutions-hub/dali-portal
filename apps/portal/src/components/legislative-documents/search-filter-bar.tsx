"use client";

import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Search } from "@repo/ui/lib/lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { DocumentFilters } from "types/legislative-documents.types";
import { useDebounce, useSanitizeParams } from "@/hooks";
import {
	CLASSIFICATIONS,
	DOCUMENT_TYPES,
} from "@/lib/legislative-documents/constants";
import { buildQueryString } from "@/lib/legislative-documents/utils";

interface SearchFilterBarProps {
	availableYears: number[];
}

export function SearchFilterBar({ availableYears }: SearchFilterBarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const rawSearch = searchParams.get("search") || "";
	const rawType = searchParams.get("type") || "all";
	const rawYear = searchParams.get("year") || "all";
	const rawClassification = searchParams.get("classification") || "all";

	// Local state for debounced search input
	const [searchInput, setSearchInput] = useState<string>(rawSearch);

	// Compute valid options
	const validTypeValues = useMemo(() => DOCUMENT_TYPES.map((t) => t.value), []);
	const validYearValues = useMemo(
		() => availableYears.map((y) => String(y)),
		[availableYears],
	);
	const validClassifications = useMemo(() => CLASSIFICATIONS, []);

	// Sanitize incoming params to avoid blank selects when URL contains invalid values
	type DocType = DocumentFilters["type"];
	type DocClass = DocumentFilters["classification"];

	const isValidType = (v: unknown): v is DocType =>
		typeof v === "string" &&
		(Array.from(validTypeValues) as unknown as string[]).includes(v as string);
	const isValidClassification = (v: unknown): v is DocClass =>
		typeof v === "string" &&
		(Array.from(validClassifications) as unknown as string[]).includes(
			v as string,
		);

	const selectedType: DocType | "all" = isValidType(rawType) ? rawType : "all";
	const selectedYear =
		rawYear === "all" || validYearValues.includes(rawYear) ? rawYear : "all";
	const selectedClassification: DocClass | "all" = isValidClassification(
		rawClassification,
	)
		? rawClassification
		: "all";

	// Use debounce hook for search input
	const debouncedSearch = useDebounce(searchInput, 400);

	// Use sanitize hook to clean up URL params on mount
	useSanitizeParams({
		rawParams: {
			search: rawSearch,
			type: rawType,
			year: rawYear,
			classification: rawClassification,
		},
		sanitizedParams: {
			search: rawSearch || "",
			type: selectedType,
			year: selectedYear,
			classification: selectedClassification,
			page: searchParams.get("page") || "1",
		},
		buildQuery: buildQueryString,
		basePath: "/legislative-documents",
	});

	// Helper to navigate with sanitized params
	const navigateWithParams = (params: Record<string, string>) => {
		const baseParams = {
			search: searchInput,
			type: selectedType,
			year: selectedYear,
			classification: selectedClassification,
			page: "1",
		};

		const newParams = { ...baseParams, ...params };
		const queryString = buildQueryString(newParams);
		router.push(`/legislative-documents?${queryString}`);
	};

	const handleFilterChange = (key: string, value: string) => {
		navigateWithParams({ [key]: value });
	};

	// Navigate when debounced search changes (not on every keystroke)
	if (debouncedSearch !== rawSearch) {
		navigateWithParams({ search: debouncedSearch });
	}

	return (
		<div className="sticky top-19 z-20 bg-gray-50 pt-6 pb-4 mb-0 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-gray-200">
			<div className="container mx-auto flex flex-col md:flex-row gap-3 items-start md:items-center justify-between w-full">
				{/* Left: Search */}
				<div className="relative w-full md:w-80">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
					<Input
						placeholder="Search documents..."
						value={searchInput}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setSearchInput(e.target.value)
						}
						className="pl-9 h-10 bg-white"
					/>
				</div>

				{/* Right: Filters */}
				<div className="flex gap-3 items-center flex-wrap">
					{/* Type Filter */}
					<Select
						value={selectedType}
						onValueChange={(value) => handleFilterChange("type", value)}
					>
						<SelectTrigger className="w-48 h-10 bg-white">
							<SelectValue placeholder="All Types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{DOCUMENT_TYPES.map((type) => (
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
						<SelectTrigger className="w-36 h-10 bg-white">
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
						<SelectTrigger className="w-52 h-10 bg-white">
							<SelectValue placeholder="All Classifications" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Classifications</SelectItem>
							{CLASSIFICATIONS.map((classification) => (
								<SelectItem key={classification} value={classification}>
									{classification.length > 30
										? `${classification.slice(0, 30)}...`
										: classification}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
