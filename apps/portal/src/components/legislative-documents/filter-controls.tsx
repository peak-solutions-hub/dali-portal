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
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@repo/ui/components/drawer";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { useIsMobile } from "@repo/ui/hooks";
import {
	Check,
	ChevronsUpDown,
	FilterIcon,
	XIcon,
} from "@repo/ui/lib/lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
	ComponentProps,
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

interface FilterControlsProps {
	availableYears: number[];
}

// Shared filter button component - forward ref & props so Trigger asChild works
const FilterButton = forwardRef<
	HTMLButtonElement,
	{
		hasActiveFilters: boolean;
		activeFilterCount: number;
	} & ComponentProps<typeof Button>
>(({ hasActiveFilters, activeFilterCount, ...props }, ref) => {
	return (
		<Button
			ref={ref}
			{...props}
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
	);
});

// Mobile Drawer Component
function MobileFilterDrawer({
	availableYears,
	selectedType,
	selectedYear,
	selectedClassification,
	onTypeChange,
	onYearChange,
	onClassificationChange,
	onApply,
	onClear,
	hasActiveFilters,
	activeFilterCount,
	open,
	setOpen,
}: {
	availableYears: number[];
	selectedType: string;
	selectedYear: string;
	selectedClassification: string;
	onTypeChange: (type: string) => void;
	onYearChange: (year: string) => void;
	onClassificationChange: (classification: string) => void;
	onApply: () => void;
	onClear: () => void;
	hasActiveFilters: boolean;
	activeFilterCount: number;
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const [view, setView] = useState<"main" | "year" | "classification">("main");

	// Reset view when drawer closes
	useEffect(() => {
		if (!open) {
			const timeout = setTimeout(() => setView("main"), 300);
			return () => clearTimeout(timeout);
		}
	}, [open]);

	const handleApply = () => {
		onApply();
		setOpen(false);
	};

	const handleClear = () => {
		onClear();
		setOpen(false);
	};

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<FilterButton
					hasActiveFilters={hasActiveFilters}
					activeFilterCount={activeFilterCount}
				/>
			</DrawerTrigger>

			<DrawerContent className="h-[90dvh] flex flex-col">
				<DrawerHeader className="shrink-0 border-b">
					<div className="flex items-center justify-between">
						{view !== "main" && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setView("main")}
								className="p-0 h-auto hover:bg-transparent text-[#a60202]"
							>
								← Back
							</Button>
						)}
						{view === "main" && <div className="w-16" />}
						<DrawerTitle className="text-center flex-1">
							{view === "main" && "Filter Documents"}
							{view === "year" && "Select Year"}
							{view === "classification" && "Select Classification"}
						</DrawerTitle>
						<div className="w-16" />
					</div>
				</DrawerHeader>

				<div className="flex-1 overflow-y-auto">
					{view === "main" && (
						<div className="space-y-6 px-4 py-4">
							{/* Document Type */}
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-gray-900">
									Document Type
								</h3>
								<div className="space-y-2">
									<label className="flex cursor-pointer items-center gap-2">
										<Checkbox
											checked={selectedType === "all"}
											onCheckedChange={() => onTypeChange("all")}
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
												onCheckedChange={() => onTypeChange(type.value)}
											/>
											<span className="text-sm text-gray-700">
												{type.label}
											</span>
										</label>
									))}
								</div>
							</div>

							{/* Year */}
							<div className="space-y-2 border-t pt-4">
								<h3 className="text-sm font-semibold text-gray-900">Year</h3>
								<Button
									variant="outline"
									className="w-full justify-between h-12 cursor-pointer"
									onClick={() => setView("year")}
								>
									{selectedYear === "all" ? "All Years" : selectedYear}
									<ChevronsUpDown className="h-4 w-4 opacity-50" />
								</Button>
							</div>

							{/* Classification */}
							<div className="space-y-2 border-t pt-4">
								<h3 className="text-sm font-semibold text-gray-900">
									Classification
								</h3>
								<Button
									variant="outline"
									className="w-full justify-between h-12 cursor-pointer"
									onClick={() => setView("classification")}
								>
									<span className="truncate">
										{selectedClassification === "all"
											? "All Classifications"
											: CLASSIFICATION_TYPES.find(
													(c) => c.value === selectedClassification,
												)?.label}
									</span>
									<ChevronsUpDown className="h-4 w-4 opacity-50" />
								</Button>
							</div>
						</div>
					)}

					{view === "year" && (
						<Command className="rounded-none border-none h-full">
							<CommandInput
								placeholder="Search years..."
								className="h-12 text-base"
								autoFocus={false}
							/>
							<CommandList className="max-h-full pb-20">
								<CommandEmpty>No year found.</CommandEmpty>
								<CommandGroup>
									<CommandItem
										onSelect={() => {
											onYearChange("all");
											setView("main");
										}}
										className="py-3"
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												selectedYear === "all" ? "opacity-100" : "opacity-0",
											)}
										/>
										All Years
									</CommandItem>
									{availableYears.map((year) => (
										<CommandItem
											key={year}
											onSelect={() => {
												onYearChange(year.toString());
												setView("main");
											}}
											className="py-3"
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
					)}

					{view === "classification" && (
						<Command className="rounded-none border-none h-full">
							<CommandInput
								placeholder="Search classifications..."
								className="h-12 text-base"
								autoFocus={false}
							/>
							<CommandList className="max-h-full pb-20">
								<CommandEmpty>No classification found.</CommandEmpty>
								<CommandGroup>
									<CommandItem
										onSelect={() => {
											onClassificationChange("all");
											setView("main");
										}}
										className="py-3"
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
											onSelect={() => {
												onClassificationChange(classification.value);
												setView("main");
											}}
											className="py-3"
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
					)}
				</div>

				<DrawerFooter className="shrink-0 border-t">
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={handleClear}
							className="flex-1"
							size="sm"
						>
							<XIcon className="w-4 h-4 mr-2" />
							Clear
						</Button>
						<Button
							onClick={handleApply}
							className="flex-1 bg-[#a60202] hover:bg-[#8a0101]"
							size="sm"
						>
							Apply Filters
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

// Desktop Popover Component
function DesktopFilterPopover({
	availableYears,
	selectedType,
	selectedYear,
	selectedClassification,
	onTypeChange,
	onYearChange,
	onClassificationChange,
	onApply,
	onClear,
	hasActiveFilters,
	activeFilterCount,
	open,
	setOpen,
}: {
	availableYears: number[];
	selectedType: string;
	selectedYear: string;
	selectedClassification: string;
	onTypeChange: (type: string) => void;
	onYearChange: (year: string) => void;
	onClassificationChange: (classification: string) => void;
	onApply: () => void;
	onClear: () => void;
	hasActiveFilters: boolean;
	activeFilterCount: number;
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const handleApply = () => {
		onApply();
		setOpen(false);
	};

	const handleClear = () => {
		onClear();
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<FilterButton
					hasActiveFilters={hasActiveFilters}
					activeFilterCount={activeFilterCount}
				/>
			</PopoverTrigger>
			<PopoverContent className="w-96 p-0" align="end">
				<div className="p-4">
					<div className="space-y-4">
						{/* Document Type */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold text-gray-900">
								Document Type
							</h3>
							<div className="space-y-2">
								<label className="flex cursor-pointer items-center gap-2">
									<Checkbox
										checked={selectedType === "all"}
										onCheckedChange={() => onTypeChange("all")}
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
											onCheckedChange={() => onTypeChange(type.value)}
										/>
										<span className="text-sm text-gray-700">{type.label}</span>
									</label>
								))}
							</div>
						</div>

						{/* Year */}
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
								<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
									<Command className="min-w-80">
										<CommandInput placeholder="Search years..." />
										<CommandEmpty>No year found.</CommandEmpty>
										<CommandList>
											<CommandGroup>
												<CommandItem
													value="all"
													onSelect={() => onYearChange("all")}
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
														onSelect={() => onYearChange(year.toString())}
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

						{/* Classification */}
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
								<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
									<Command className="max-w-80">
										<CommandInput placeholder="Search classifications..." />
										<CommandEmpty>No classification found.</CommandEmpty>
										<CommandList>
											<CommandGroup>
												<CommandItem
													value="all"
													onSelect={() => onClassificationChange("all")}
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
														onSelect={() =>
															onClassificationChange(classification.value)
														}
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
							onClick={handleClear}
							className="flex-1"
							size="sm"
						>
							<XIcon className="w-4 h-4 mr-2" />
							Clear
						</Button>
						<Button
							onClick={handleApply}
							className="flex-1 bg-[#a60202] hover:bg-[#8a0101]"
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

	// Get current values from URL - extract individual values, not an object
	const urlType = searchParams.get("type") || "all";
	const urlYear = searchParams.get("year") || "all";
	const urlClassification = searchParams.get("classification") || "all";

	// Local state for pending filter selections
	const [selectedType, setSelectedType] = useState(urlType);
	const [selectedYear, setSelectedYear] = useState(urlYear);
	const [selectedClassification, setSelectedClassification] =
		useState(urlClassification);

	// Sync local state when URL changes - FIXED: use individual values
	useEffect(() => {
		setSelectedType(urlType);
		setSelectedYear(urlYear);
		setSelectedClassification(urlClassification);
	}, [urlType, urlYear, urlClassification]);

	const hasActiveFilters = useMemo(
		() => urlType !== "all" || urlYear !== "all" || urlClassification !== "all",
		[urlType, urlYear, urlClassification],
	);

	const activeFilterCount = useMemo(
		() =>
			[
				urlType !== "all",
				urlYear !== "all",
				urlClassification !== "all",
			].filter(Boolean).length,
		[urlType, urlYear, urlClassification],
	);

	// FIXED: Remove searchParams from dependencies, read it at execution time
	const applyFilters = useCallback(() => {
		const currentSearchParams = new URLSearchParams(window.location.search);
		const search = currentSearchParams.get("search") || "";

		const queryString = buildQueryString({
			search,
			type: selectedType,
			year: selectedYear,
			classification: selectedClassification,
			page: "1",
		});
		router.push(`/legislative-documents?${queryString}`);
	}, [selectedType, selectedYear, selectedClassification, router]);

	// FIXED: Remove searchParams from dependencies
	const clearFilters = useCallback(() => {
		const currentSearchParams = new URLSearchParams(window.location.search);
		const search = currentSearchParams.get("search") || "";

		setSelectedType("all");
		setSelectedYear("all");
		setSelectedClassification("all");

		const queryString = buildQueryString({
			search,
			type: "all",
			year: "all",
			classification: "all",
			page: "1",
		});
		router.push(`/legislative-documents?${queryString}`);
	}, [router]);

	const sharedProps = {
		availableYears,
		selectedType,
		selectedYear,
		selectedClassification,
		onTypeChange: setSelectedType,
		onYearChange: setSelectedYear,
		onClassificationChange: setSelectedClassification,
		onApply: applyFilters,
		onClear: clearFilters,
		hasActiveFilters,
		activeFilterCount,
		open,
		setOpen,
	};

	return isMobile ? (
		<MobileFilterDrawer {...sharedProps} />
	) : (
		<div className="flex items-center gap-2">
			<DesktopFilterPopover {...sharedProps} />
			{hasActiveFilters && (
				<Button
					variant="outline"
					size="sm"
					className="h-10 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
					onClick={clearFilters}
				>
					Clear All
				</Button>
			)}
		</div>
	);
}
