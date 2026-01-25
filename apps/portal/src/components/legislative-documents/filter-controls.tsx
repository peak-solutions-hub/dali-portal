"use client";

import {
	buildQueryString,
	CLASSIFICATION_TYPES,
	LEGISLATIVE_DOCUMENT_TYPES,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@repo/ui/components/command";
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
import {
	Check,
	ChevronsUpDown,
	FilterIcon,
	XIcon,
} from "@repo/ui/lib/lucide-react";
import { cn } from "@repo/ui/lib/utils";
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
	filteredYears: number[];
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

					{/* Year - Typeahead Combobox */}
					<div className="space-y-2 border-t pt-4">
						<h3 className="text-sm font-semibold text-gray-900">Year</h3>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									className="w-full h-10 justify-between bg-white hover:bg-white"
								>
									<span className="truncate">
										{selectedYear && selectedYear !== "all"
											? selectedYear
											: "All Years"}
									</span>
									<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-(--radix-popover-trigger-width) p-0">
								<Command>
									<CommandInput placeholder="Search years..." />
									<CommandEmpty>No year found.</CommandEmpty>
									<CommandList className="max-h-75 overflow-auto">
										<CommandGroup>
											<CommandItem
												value="all"
												onSelect={() => {
													setSelectedYear("all");
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														selectedYear === "all"
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												All Years
											</CommandItem>
											{availableYears.map((year) => (
												<CommandItem
													key={year}
													value={year.toString()}
													onSelect={() => {
														setSelectedYear(year.toString());
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															selectedYear === year.toString()
																? "opacity-100"
																: "opacity-0",
														)}
													/>
													{year}
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

					{/* Classification - Typeahead Combobox */}
					<div className="space-y-2 border-t pt-4">
						<h3 className="text-sm font-semibold text-gray-900">
							Classification
						</h3>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									className="w-full h-10 justify-between bg-white hover:bg-white"
								>
									<span className="truncate">
										{selectedClassification && selectedClassification !== "all"
											? CLASSIFICATION_TYPES.find(
													(c) => c.value === selectedClassification,
												)?.label
											: "All Classifications"}
									</span>
									<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-(--radix-popover-trigger-width) p-0">
								<Command>
									<CommandInput placeholder="Search classifications..." />
									<CommandEmpty>No classification found.</CommandEmpty>
									<CommandList className="max-h-75 overflow-auto">
										<CommandGroup>
											<CommandItem
												value="all"
												onSelect={() => {
													setSelectedClassification("all");
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														selectedClassification === "all"
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												All Classifications
											</CommandItem>
											{CLASSIFICATION_TYPES.map((classification) => (
												<CommandItem
													key={classification.value}
													value={classification.value}
													onSelect={() => {
														setSelectedClassification(classification.value);
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															selectedClassification === classification.value
																? "opacity-100"
																: "opacity-0",
														)}
													/>
													{classification.label}
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
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

						{/* Year - Typeahead Combobox */}
						<div className="space-y-3 border-t pt-4">
							<h3 className="text-sm font-semibold text-gray-900">Year</h3>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										className="w-full h-10 justify-between bg-white hover:bg-white"
									>
										{selectedYear && selectedYear !== "all"
											? selectedYear
											: "All Years"}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-(--radix-popover-trigger-width) p-0">
									<Command>
										<CommandInput placeholder="Search years..." />
										<CommandEmpty>No year found.</CommandEmpty>
										<CommandList>
											<CommandGroup>
												<CommandItem
													value="all"
													onSelect={() => {
														setSelectedYear("all");
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															selectedYear === "all"
																? "opacity-100"
																: "opacity-0",
														)}
													/>
													All Years
												</CommandItem>
												{filterState.filteredYears.map((year) => (
													<CommandItem
														key={year}
														value={year.toString()}
														onSelect={() => {
															setSelectedYear(year.toString());
														}}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																selectedYear === year.toString()
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
														{year}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						{/* Classification - Typeahead Combobox */}
						<div className="space-y-3 border-t pt-4">
							<h3 className="text-sm font-semibold text-gray-900">
								Classification
							</h3>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										className="w-full h-10 justify-between bg-white hover:bg-white"
									>
										<span className="truncate">
											{selectedClassification &&
											selectedClassification !== "all"
												? CLASSIFICATION_TYPES.find(
														(c) => c.value === selectedClassification,
													)?.label
												: "All Classifications"}
										</span>
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-(--radix-popover-trigger-width) p-0">
									<Command>
										<CommandInput placeholder="Search classifications..." />
										<CommandEmpty>No classification found.</CommandEmpty>
										<CommandList>
											<CommandGroup>
												<CommandItem
													value="all"
													onSelect={() => {
														setSelectedClassification("all");
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															selectedClassification === "all"
																? "opacity-100"
																: "opacity-0",
														)}
													/>
													All Classifications
												</CommandItem>
												{CLASSIFICATION_TYPES.map((classification) => (
													<CommandItem
														key={classification.value}
														value={classification.value}
														onSelect={() => {
															setSelectedClassification(classification.value);
														}}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																selectedClassification === classification.value
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
														{classification.label}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
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

	// Search state for filtering year dropdown
	const [yearSearch, setYearSearch] = useState("");

	// Filter years based on search
	const filteredYears = useMemo(() => {
		if (!yearSearch) return availableYears;
		return availableYears.filter((year) =>
			year.toString().includes(yearSearch),
		);
	}, [availableYears, yearSearch]);

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
		filteredYears,
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
