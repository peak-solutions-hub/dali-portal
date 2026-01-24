"use client";

import {
	buildQueryString,
	CLASSIFICATION_TYPES,
	LEGISLATIVE_DOCUMENT_TYPES,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@repo/ui/components/drawer";
import { Input } from "@repo/ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useIsMobile } from "@repo/ui/hooks";
import { FilterIcon, XIcon } from "@repo/ui/lib/lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FilterControlsProps {
	availableYears: number[];
}

interface FilterState {
	selectedType: string;
	selectedYear: string;
	selectedClassification: string;
	setSelectedType: (type: string) => void;
	setSelectedYear: (year: string) => void;
	setSelectedClassification: (classification: string) => void;
	applyFilters: () => void;
	clearFilters: () => void;
	hasPendingChanges: boolean;
	yearSearch: string;
	setYearSearch: (search: string) => void;
	classificationSearch: string;
	setClassificationSearch: (search: string) => void;
	filteredYears: number[];
	filteredClassifications: Array<{ value: string; label: string }>;
}

interface MobileFilterControlDrawerProps {
	availableYears: number[];
	filterState: FilterState;
	hasActiveFilters: boolean;
	activeFilterCount: number;
	open: boolean;
	setOpen: (open: boolean) => void;
}

interface DesktopFilterControlProps {
	availableYears: number[];
	filterState: FilterState;
	hasActiveFilters: boolean;
	activeFilterCount: number;
	open: boolean;
	setOpen: (open: boolean) => void;
}

function MobileFilterControlDrawer({
	availableYears,
	filterState,
	hasActiveFilters,
	activeFilterCount,
	open,
	setOpen,
}: MobileFilterControlDrawerProps) {
	const {
		selectedType,
		selectedYear,
		selectedClassification,
		setSelectedType,
		setSelectedYear,
		setSelectedClassification,
		applyFilters,
		clearFilters,
		hasPendingChanges,
	} = filterState;

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-10 gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
				>
					<FilterIcon className="h-4 w-4" />
					Filter
					{hasActiveFilters && (
						<span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#a60202] text-[10px] text-white">
							{activeFilterCount}
						</span>
					)}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Filter Documents</DrawerTitle>
				</DrawerHeader>

				<div className="space-y-4 px-4 py-4">
					{/* Document Type */}
					<div className="space-y-2">
						<h3 className="text-sm font-semibold text-gray-900">
							Document Type
						</h3>
						<div className="space-y-2">
							<label className="flex cursor-pointer items-center gap-2">
								<Checkbox
									checked={selectedType === "all"}
									onCheckedChange={() => setSelectedType("all")}
								/>
								<span className="text-sm text-gray-700">All Types</span>
							</label>
							{LEGISLATIVE_DOCUMENT_TYPES.map((type) => (
								<label
									key={type.value}
									className="flex cursor-pointer items-center gap-2"
								>
									<Checkbox
										checked={selectedType === type.value}
										onCheckedChange={() => setSelectedType(type.value)}
									/>
									<span className="text-sm text-gray-700">{type.label}</span>
								</label>
							))}
						</div>
					</div>

					{/* Year - Searchable Select */}
					<div className="space-y-2 border-t pt-4">
						<h3 className="text-sm font-semibold text-gray-900">Year</h3>
						<Select
							value={selectedYear}
							onValueChange={(value) => {
								setSelectedYear(value);
								filterState.setYearSearch("");
							}}
						>
							<SelectTrigger className="w-full h-10 bg-white">
								<SelectValue placeholder="All Years" />
							</SelectTrigger>
							<SelectContent className="w-[(--radix-select-trigger-width)]">
								<div className="p-2 sticky top-0 bg-white border-b z-10">
									<div className="relative">
										<Input
											placeholder="Type to search..."
											value={filterState.yearSearch}
											onChange={(e) =>
												filterState.setYearSearch(e.target.value)
											}
											className="h-8 pr-8"
											onClick={(e) => e.stopPropagation()}
										/>
										{filterState.yearSearch && (
											<button
												type="button"
												onClick={() => filterState.setYearSearch("")}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
											>
												<XIcon className="w-4 h-4" />
											</button>
										)}
									</div>
								</div>
								<div className="max-h-50 overflow-y-auto">
									<SelectItem value="all">All Years</SelectItem>
									{filterState.filteredYears.length > 0 ? (
										filterState.filteredYears.map((year) => (
											<SelectItem key={year} value={year.toString()}>
												{year}
											</SelectItem>
										))
									) : (
										<div className="px-2 py-6 text-center text-sm text-gray-500">
											No years found
										</div>
									)}
								</div>
							</SelectContent>
						</Select>
					</div>

					{/* Classification - Searchable */}
					<div className="space-y-2 border-t pt-4">
						<h3 className="text-sm font-semibold text-gray-900">
							Classification
						</h3>
						<Select
							value={selectedClassification}
							onValueChange={(value) => {
								setSelectedClassification(value);
								filterState.setClassificationSearch("");
							}}
						>
							<SelectTrigger className="w-full h-10 bg-white">
								<SelectValue placeholder="All Classifications" />
							</SelectTrigger>
							<SelectContent className="w-[--radix-select-trigger-width]">
								<div className="p-2 sticky top-0 bg-white border-b z-10">
									<div className="relative">
										<Input
											placeholder="Type to search..."
											value={filterState.classificationSearch}
											onChange={(e) =>
												filterState.setClassificationSearch(e.target.value)
											}
											className="h-8 pr-8"
											onClick={(e) => e.stopPropagation()}
										/>
										{filterState.classificationSearch && (
											<button
												type="button"
												onClick={() => filterState.setClassificationSearch("")}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
											>
												<XIcon className="w-4 h-4" />
											</button>
										)}
									</div>
								</div>
								<div className="max-h-50 overflow-y-auto">
									{filterState.filteredClassifications.length > 0 ? (
										filterState.filteredClassifications.map(
											(classification) => (
												<SelectItem
													key={classification.value}
													value={classification.value}
												>
													{classification.label}
												</SelectItem>
											),
										)
									) : (
										<div className="px-2 py-6 text-center text-sm text-gray-500">
											No classifications found
										</div>
									)}
								</div>
							</SelectContent>
						</Select>
					</div>
				</div>

				<DrawerFooter className="border-t">
					<div className="flex w-full gap-3">
						<Button variant="outline" onClick={clearFilters} className="flex-1">
							<XIcon className="w-4 h-4 mr-2" />
							Clear
						</Button>
						<Button
							onClick={applyFilters}
							className="flex-1 bg-[#a60202] hover:bg-[#8a0101]"
							disabled={!hasPendingChanges}
						>
							Apply Filters
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function DesktopFilterControl({
	availableYears,
	filterState,
	hasActiveFilters,
	activeFilterCount,
	open,
	setOpen,
}: DesktopFilterControlProps) {
	const {
		selectedType,
		selectedYear,
		selectedClassification,
		setSelectedType,
		setSelectedYear,
		setSelectedClassification,
		applyFilters,
		clearFilters,
		hasPendingChanges,
	} = filterState;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-10 gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
				>
					<FilterIcon className="h-4 w-4" />
					Filter
					{hasActiveFilters && (
						<span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#a60202] text-[10px] text-white">
							{activeFilterCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="start">
				<div className="space-y-4">
					<div className="space-y-4 max-h-96 overflow-y-auto">
						{/* Document Type */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold text-gray-900">
								Document Type
							</h3>
							<div className="space-y-2">
								<label className="flex cursor-pointer items-center gap-2">
									<Checkbox
										checked={selectedType === "all"}
										onCheckedChange={() => setSelectedType("all")}
									/>
									<span className="text-sm text-gray-700">All Types</span>
								</label>
								{LEGISLATIVE_DOCUMENT_TYPES.map((type) => (
									<label
										key={type.value}
										className="flex cursor-pointer items-center gap-2"
									>
										<Checkbox
											checked={selectedType === type.value}
											onCheckedChange={() => setSelectedType(type.value)}
										/>
										<span className="text-sm text-gray-700">{type.label}</span>
									</label>
								))}
							</div>
						</div>

						{/* Year - Searchable Select */}
						<div className="space-y-3 border-t pt-4">
							<h3 className="text-sm font-semibold text-gray-900">Year</h3>
							<Select
								value={selectedYear}
								onValueChange={(value) => {
									setSelectedYear(value);
									filterState.setYearSearch("");
								}}
							>
								<SelectTrigger className="w-full h-10 bg-white">
									<SelectValue placeholder="All Years" />
								</SelectTrigger>
								<SelectContent className="w-(--radix-select-trigger-width)">
									<div className="p-2 sticky top-0 bg-white border-b z-10">
										<div className="relative">
											<Input
												placeholder="Type to search..."
												value={filterState.yearSearch}
												onChange={(e) =>
													filterState.setYearSearch(e.target.value)
												}
												className="h-8 pr-8"
												onClick={(e) => e.stopPropagation()}
											/>
											{filterState.yearSearch && (
												<button
													type="button"
													onClick={() => filterState.setYearSearch("")}
													className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
												>
													<XIcon className="w-4 h-4" />
												</button>
											)}
										</div>
									</div>
									<div className="max-h-50 overflow-y-auto">
										<SelectItem value="all">All Years</SelectItem>
										{filterState.filteredYears.length > 0 ? (
											filterState.filteredYears.map((year) => (
												<SelectItem key={year} value={year.toString()}>
													{year}
												</SelectItem>
											))
										) : (
											<div className="px-2 py-6 text-center text-sm text-gray-500">
												No years found
											</div>
										)}
									</div>
								</SelectContent>
							</Select>
						</div>

						{/* Classification - Searchable */}
						<div className="space-y-3 border-t pt-4">
							<h3 className="text-sm font-semibold text-gray-900">
								Classification
							</h3>
							<Select
								value={selectedClassification}
								onValueChange={(value) => {
									setSelectedClassification(value);
									filterState.setClassificationSearch("");
								}}
							>
								<SelectTrigger className="w-full h-10 bg-white">
									<SelectValue placeholder="All Classifications" />
								</SelectTrigger>
								<SelectContent className="w-[--radix-select-trigger-width]">
									<div className="p-2 sticky top-0 bg-white border-b z-10">
										<div className="relative">
											<Input
												placeholder="Type to search..."
												value={filterState.classificationSearch}
												onChange={(e) =>
													filterState.setClassificationSearch(e.target.value)
												}
												className="h-8 pr-8"
												onClick={(e) => e.stopPropagation()}
											/>
											{filterState.classificationSearch && (
												<button
													type="button"
													onClick={() =>
														filterState.setClassificationSearch("")
													}
													className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
												>
													<XIcon className="w-4 h-4" />
												</button>
											)}
										</div>
									</div>
									<div className="max-h-50 overflow-y-auto">
										{filterState.filteredClassifications.length > 0 ? (
											filterState.filteredClassifications.map(
												(classification) => (
													<SelectItem
														key={classification.value}
														value={classification.value}
													>
														{classification.label}
													</SelectItem>
												),
											)
										) : (
											<div className="px-2 py-6 text-center text-sm text-gray-500">
												No classifications found
											</div>
										)}
									</div>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex gap-2 pt-4 border-t mt-4">
						<Button
							variant="outline"
							onClick={clearFilters}
							className="flex-1"
							size="sm"
						>
							<XIcon className="w-4 h-4 mr-2" />
							Clear
						</Button>
						<Button
							onClick={applyFilters}
							className="flex-1 bg-[#a60202] hover:bg-[#8a0101]"
							disabled={!hasPendingChanges}
							size="sm"
						>
							Apply Filters
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function FilterControls({ availableYears }: FilterControlsProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);

	// Get current values from URL
	const currentParams = useMemo(
		() => ({
			type: searchParams.get("type") || "all",
			year: searchParams.get("year") || "all",
			classification: searchParams.get("classification") || "all",
		}),
		[searchParams],
	);

	// Local state for pending filter selections
	const [selectedType, setSelectedType] = useState(currentParams.type);
	const [selectedYear, setSelectedYear] = useState(currentParams.year);
	const [selectedClassification, setSelectedClassification] = useState(
		currentParams.classification,
	);

	// Search states for filtering dropdowns
	const [yearSearch, setYearSearch] = useState("");
	const [classificationSearch, setClassificationSearch] = useState("");

	// Filter years based on search
	const filteredYears = useMemo(() => {
		if (!yearSearch) return availableYears;
		return availableYears.filter((year) =>
			year.toString().includes(yearSearch),
		);
	}, [availableYears, yearSearch]);

	// Filter classifications based on search
	const filteredClassifications = useMemo(() => {
		const allClassifications = [
			{ value: "all", label: "All Classifications" },
			...CLASSIFICATION_TYPES,
		];
		if (!classificationSearch) return allClassifications;
		return allClassifications.filter((item) =>
			item.label.toLowerCase().includes(classificationSearch.toLowerCase()),
		);
	}, [classificationSearch]);

	// Sync local state when URL changes (e.g., user uses Clear Filters)
	useEffect(() => {
		setSelectedType(currentParams.type);
		setSelectedYear(currentParams.year);
		setSelectedClassification(currentParams.classification);
	}, [currentParams]);

	const hasActiveFilters = useMemo(
		() =>
			currentParams.type !== "all" ||
			currentParams.year !== "all" ||
			currentParams.classification !== "all",
		[currentParams],
	);

	const activeFilterCount = useMemo(
		() =>
			[
				currentParams.type !== "all",
				currentParams.year !== "all",
				currentParams.classification !== "all",
			].filter(Boolean).length,
		[currentParams],
	);

	const hasPendingChanges = useMemo(
		() =>
			selectedType !== currentParams.type ||
			selectedYear !== currentParams.year ||
			selectedClassification !== currentParams.classification,
		[selectedType, selectedYear, selectedClassification, currentParams],
	);

	const applyFilters = useCallback(() => {
		const search = searchParams.get("search") || "";
		const queryString = buildQueryString({
			search,
			type: selectedType,
			year: selectedYear,
			classification: selectedClassification,
			page: "1",
		});
		router.push(`/legislative-documents?${queryString}`);
		setOpen(false);
	}, [
		selectedType,
		selectedYear,
		selectedClassification,
		searchParams,
		router,
	]);

	const clearFilters = useCallback(() => {
		const search = searchParams.get("search") || "";
		setSelectedType("all");
		setSelectedYear("all");
		setSelectedClassification("all");
		setYearSearch("");
		setClassificationSearch("");
		const queryString = buildQueryString({
			search,
			type: "all",
			year: "all",
			classification: "all",
			page: "1",
		});
		router.push(`/legislative-documents?${queryString}`);
		setOpen(false);
	}, [searchParams, router]);

	const filterState: FilterState = {
		selectedType,
		selectedYear,
		selectedClassification,
		setSelectedType,
		setSelectedYear,
		setSelectedClassification,
		applyFilters,
		clearFilters,
		hasPendingChanges,
		yearSearch,
		setYearSearch,
		classificationSearch,
		setClassificationSearch,
		filteredYears,
		filteredClassifications,
	};

	return (
		<>
			{isMobile ? (
				<MobileFilterControlDrawer
					availableYears={availableYears}
					filterState={filterState}
					hasActiveFilters={hasActiveFilters}
					activeFilterCount={activeFilterCount}
					open={open}
					setOpen={setOpen}
				/>
			) : (
				<DesktopFilterControl
					availableYears={availableYears}
					filterState={filterState}
					hasActiveFilters={hasActiveFilters}
					activeFilterCount={activeFilterCount}
					open={open}
					setOpen={setOpen}
				/>
			)}
		</>
	);
}
