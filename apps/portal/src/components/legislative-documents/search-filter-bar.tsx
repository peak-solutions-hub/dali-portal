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

	const searchTerm = searchParams.get("search") || "";
	const selectedType = searchParams.get("type") || "all";
	const selectedYear = searchParams.get("year") || "all";
	const selectedClassification = searchParams.get("classification") || "all";

	const handleFilterChange = (key: string, value: string) => {
		const currentParams = {
			search: searchTerm,
			type: selectedType,
			year: selectedYear,
			classification: selectedClassification,
			page: "1", // Reset to page 1 on filter change
		};

		const newParams = {
			...currentParams,
			[key]: value,
		};

		const queryString = buildQueryString(newParams);
		router.push(`/legislative-documents?${queryString}`);
	};

	return (
		<div className="sticky top-19 z-20 bg-gray-50 pt-6 pb-4 mb-0 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-gray-200">
			<div className="container mx-auto flex flex-col md:flex-row gap-3 items-start md:items-center justify-between w-full">
				{/* Left: Search */}
				<div className="relative w-full md:w-80">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
					<Input
						placeholder="Search documents..."
						value={searchTerm}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							handleFilterChange("search", e.target.value)
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
						<SelectTrigger className="w-44 h-10 bg-white">
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
						<SelectTrigger className="w-48 h-10 bg-white">
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
