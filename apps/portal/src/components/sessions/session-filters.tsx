"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import { Checkbox } from "@repo/ui/components/checkbox";
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
import { useIsMobile, useSessionFilters } from "@repo/ui/hooks";
import { CalendarIcon, FilterIcon, XIcon } from "@repo/ui/lib/lucide-react";
import { format } from "date-fns";
import * as React from "react";
import { useState } from "react";
import {
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeBadgeClass,
	getSessionTypeLabel,
	SESSION_STATUSES,
	SESSION_TYPES,
} from "@/lib/session-ui";

interface SessionFiltersProps {
	sortOrder: string;
}

// Enhanced Calendar Picker with Month/Year Dropdowns
function EnhancedCalendarPicker({
	date,
	onSelect,
	disabledDate,
	align = "start",
}: {
	date: Date | undefined;
	onSelect: (date: Date | undefined) => void;
	disabledDate?: (date: Date) => boolean;
	align?: "start" | "center" | "end";
}) {
	const currentYear = new Date().getFullYear();

	// Ensure min year is not earlier than 1950
	const minYear = Math.max(currentYear - 100, 1950);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="w-full h-9 justify-start text-left text-sm font-normal border-[rgba(0,0,0,0.1)] hover:bg-white cursor-pointer"
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? format(date, "P") : "Pick a date"}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align={align}>
				<Calendar
					mode="single"
					selected={date}
					onSelect={onSelect}
					disabled={disabledDate}
					captionLayout="dropdown"
					fromYear={minYear}
					toYear={currentYear}
					classNames={{
						today: "bg-transparent text-yellow-400 font-normal",
						day_selected:
							"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

// Shared Filter Button
const FilterButton = React.forwardRef<
	HTMLButtonElement,
	{
		hasActiveFilters: boolean;
		filterCount: number;
		onClick?: () => void;
	}
>(({ hasActiveFilters, filterCount, onClick, ...props }, ref) => {
	return (
		<Button
			ref={ref}
			variant="outline"
			size="sm"
			className="h-9 gap-2 border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a] hover:bg-[#f9fafb] cursor-pointer"
			onClick={onClick}
			{...props}
		>
			<FilterIcon className="h-4 w-4" />
			Filter
			{hasActiveFilters && (
				<Badge className="ml-1 h-5 w-5 rounded-full bg-[#a60202] p-0 text-[10px] text-white hover:bg-[#a60202]">
					{filterCount}
				</Badge>
			)}
		</Button>
	);
});

FilterButton.displayName = "FilterButton";

// Mobile Drawer
function MobileSessionFiltersDrawer({
	selectedTypes,
	selectedStatuses,
	dateFrom,
	dateTo,
	onTypeChange,
	onStatusChange,
	onDateFromChange,
	onDateToChange,
	onApply,
	onClear,
	hasActiveFilters,
	filterCount,
	isDateRangeInvalid,
	open,
	setOpen,
}: {
	selectedTypes: string[];
	selectedStatuses: string[];
	dateFrom: string;
	dateTo: string;
	onTypeChange: (type: string, checked: boolean) => void;
	onStatusChange: (status: string, checked: boolean) => void;
	onDateFromChange: (date: string) => void;
	onDateToChange: (date: string) => void;
	onApply: () => void;
	onClear: () => void;
	hasActiveFilters: boolean;
	filterCount: number;
	isDateRangeInvalid: boolean;
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const handleApply = () => {
		if (isDateRangeInvalid) return;
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
					filterCount={filterCount}
				/>
			</DrawerTrigger>
			<DrawerContent className="h-[90dvh] flex flex-col">
				<DrawerHeader className="shrink-0 border-b">
					<div className="flex items-center justify-between">
						<div className="w-16" />
						<DrawerTitle className="text-center flex-1">
							Filter Sessions
						</DrawerTitle>
						<div className="w-16" />
					</div>
				</DrawerHeader>

				<div className="flex-1 overflow-y-auto space-y-4 px-4 py-6">
					{/* Session Type */}
					<div>
						<h3 className="mb-3 text-sm font-semibold text-[#0a0a0a]">
							Session Type
						</h3>
						<div className="space-y-2">
							{SESSION_TYPES.map(({ value, label }) => (
								<label
									key={value}
									className="flex cursor-pointer items-center gap-2"
								>
									<Checkbox
										checked={selectedTypes.includes(value)}
										onCheckedChange={(checked) =>
											onTypeChange(value, checked as boolean)
										}
									/>
									<span className="text-sm text-[#4a5565]">{label}</span>
								</label>
							))}
						</div>
					</div>

					{/* Status */}
					<div className="border-t border-[rgba(0,0,0,0.1)] pt-4">
						<h3 className="mb-3 text-sm font-semibold text-[#0a0a0a]">
							Status
						</h3>
						<div className="space-y-2">
							{SESSION_STATUSES.map(({ value, label }) => (
								<label
									key={value}
									className="flex cursor-pointer items-center gap-2"
								>
									<Checkbox
										checked={selectedStatuses.includes(value)}
										onCheckedChange={(checked) =>
											onStatusChange(value, checked as boolean)
										}
									/>
									<span className="text-sm text-[#4a5565]">{label}</span>
								</label>
							))}
						</div>
					</div>

					{/* Date Range */}
					<div className="border-t border-[rgba(0,0,0,0.1)] pt-4">
						<h3 className="mb-3 text-sm font-semibold text-[#0a0a0a]">
							Date Range
						</h3>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<label className="text-xs text-[#6b7280]">From</label>
								<EnhancedCalendarPicker
									date={dateFrom ? new Date(dateFrom) : undefined}
									onSelect={(date) => {
										if (date) {
											onDateFromChange(format(date, "yyyy-MM-dd"));
										} else {
											onDateFromChange("");
										}
									}}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs text-[#6b7280]">To</label>
								<EnhancedCalendarPicker
									date={dateTo ? new Date(dateTo) : undefined}
									onSelect={(date) => {
										if (date) {
											onDateToChange(format(date, "yyyy-MM-dd"));
										} else {
											onDateToChange("");
										}
									}}
									disabledDate={(date) => {
										if (!dateFrom) return false;
										return date < new Date(dateFrom);
									}}
								/>
							</div>
						</div>
					</div>

					{/* Date Range Validation Error */}
					{isDateRangeInvalid && (
						<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
							<p className="text-sm text-red-600">
								"To" date must be after "From" date
							</p>
						</div>
					)}
				</div>

				<DrawerFooter className="border-t">
					<div className="flex w-full gap-3">
						<Button variant="outline" onClick={handleClear} className="flex-1">
							<XIcon className="w-4 h-4 mr-2" />
							Clear
						</Button>
						<Button
							onClick={handleApply}
							className="flex-1 bg-[#a60202] hover:bg-[#8a0101]"
							disabled={isDateRangeInvalid}
						>
							Apply Filters
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

// Desktop Popover
function DesktopSessionFilters({
	selectedTypes,
	selectedStatuses,
	dateFrom,
	dateTo,
	onTypeChange,
	onStatusChange,
	onDateFromChange,
	onDateToChange,
	onApply,
	onClear,
	hasActiveFilters,
	filterCount,
	isDateRangeInvalid,
	open,
	setOpen,
}: {
	selectedTypes: string[];
	selectedStatuses: string[];
	dateFrom: string;
	dateTo: string;
	onTypeChange: (type: string, checked: boolean) => void;
	onStatusChange: (status: string, checked: boolean) => void;
	onDateFromChange: (date: string) => void;
	onDateToChange: (date: string) => void;
	onApply: () => void;
	onClear: () => void;
	hasActiveFilters: boolean;
	filterCount: number;
	isDateRangeInvalid: boolean;
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	const handleApply = () => {
		if (isDateRangeInvalid) return;
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
					filterCount={filterCount}
				/>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="start">
				<div className="space-y-4">
					{/* Session Type */}
					<div>
						<h3 className="mb-3 text-sm font-semibold text-[#0a0a0a]">
							Session Type
						</h3>
						<div className="space-y-2">
							{SESSION_TYPES.map(({ value, label }) => (
								<label
									key={value}
									className="flex cursor-pointer items-center gap-2"
								>
									<Checkbox
										checked={selectedTypes.includes(value)}
										onCheckedChange={(checked) =>
											onTypeChange(value, checked as boolean)
										}
									/>
									<span className="text-sm text-[#4a5565]">{label}</span>
								</label>
							))}
						</div>
					</div>

					{/* Status */}
					<div className="border-t border-[rgba(0,0,0,0.1)] pt-4">
						<h3 className="mb-3 text-sm font-semibold text-[#0a0a0a]">
							Status
						</h3>
						<div className="space-y-2">
							{SESSION_STATUSES.map(({ value, label }) => (
								<label
									key={value}
									className="flex cursor-pointer items-center gap-2"
								>
									<Checkbox
										checked={selectedStatuses.includes(value)}
										onCheckedChange={(checked) =>
											onStatusChange(value, checked as boolean)
										}
									/>
									<span className="text-sm text-[#4a5565]">{label}</span>
								</label>
							))}
						</div>
					</div>

					{/* Date Range */}
					<div className="border-t border-[rgba(0,0,0,0.1)] pt-4">
						<h3 className="mb-3 text-sm font-semibold text-[#0a0a0a]">
							Date Range
						</h3>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<label className="text-xs text-[#6b7280]">From</label>
								<EnhancedCalendarPicker
									date={dateFrom ? new Date(dateFrom) : undefined}
									onSelect={(date) => {
										if (date) {
											onDateFromChange(format(date, "yyyy-MM-dd"));
										} else {
											onDateFromChange("");
										}
									}}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs text-[#6b7280]">To</label>
								<EnhancedCalendarPicker
									date={dateTo ? new Date(dateTo) : undefined}
									onSelect={(date) => {
										if (date) {
											onDateToChange(format(date, "yyyy-MM-dd"));
										} else {
											onDateToChange("");
										}
									}}
									disabledDate={(date) => {
										if (!dateFrom) return false;
										return date < new Date(dateFrom);
									}}
								/>
							</div>
						</div>
					</div>

					{/* Date Range Validation Error */}
					{isDateRangeInvalid && (
						<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
							<p className="text-sm text-red-600">
								"To" date must be after "From" date
							</p>
						</div>
					)}

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
							disabled={isDateRangeInvalid}
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

export function SessionFilters({ sortOrder }: SessionFiltersProps) {
	const { filters, updateFilters, resetFilters, getFilterCount } =
		useSessionFilters();
	const isMobile = useIsMobile();

	// Local state
	const [selectedTypes, setSelectedTypes] = useState<string[]>(filters.types);
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
		filters.statuses,
	);
	const [dateFrom, setDateFrom] = useState(filters.dateFrom || "");
	const [dateTo, setDateTo] = useState(filters.dateTo || "");
	const [open, setOpen] = useState(false);

	const hasActiveFilters = getFilterCount() > 0;

	// Validate date range
	const isDateRangeInvalid = Boolean(
		dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom),
	);

	const handleTypeChange = (type: string, checked: boolean) => {
		setSelectedTypes((prev) =>
			checked ? [...prev, type] : prev.filter((t) => t !== type),
		);
	};

	const handleStatusChange = (status: string, checked: boolean) => {
		setSelectedStatuses((prev) =>
			checked ? [...prev, status] : prev.filter((s) => s !== status),
		);
	};

	const applyFilters = () => {
		if (isDateRangeInvalid) return;

		updateFilters({
			types: selectedTypes,
			statuses: selectedStatuses,
			dateFrom: dateFrom || null,
			dateTo: dateTo || null,
			sortOrder: sortOrder as "asc" | "desc",
		});
	};

	const clearAllFilters = () => {
		setSelectedTypes([]);
		setSelectedStatuses([]);
		setDateFrom("");
		setDateTo("");
		resetFilters();
	};

	const removeFilter = (
		filterType: "type" | "status" | "dateFrom" | "dateTo",
		value: string,
	) => {
		if (filterType === "type") {
			const types = filters.types.filter((t) => t !== value);
			updateFilters({ types });
			setSelectedTypes(types);
		} else if (filterType === "status") {
			const statuses = filters.statuses.filter((s) => s !== value);
			updateFilters({ statuses });
			setSelectedStatuses(statuses);
		} else if (filterType === "dateFrom" || filterType === "dateTo") {
			// Clear both date filters when any date filter X is clicked
			updateFilters({ dateFrom: null, dateTo: null });
			setDateFrom("");
			setDateTo("");
		}
	};

	const formatDateLabel = (date: string) => {
		if (!date) return "";
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const sharedProps = {
		selectedTypes,
		selectedStatuses,
		dateFrom,
		dateTo,
		onTypeChange: handleTypeChange,
		onStatusChange: handleStatusChange,
		onDateFromChange: setDateFrom,
		onDateToChange: setDateTo,
		onApply: applyFilters,
		onClear: clearAllFilters,
		hasActiveFilters,
		filterCount: getFilterCount(),
		isDateRangeInvalid,
		open,
		setOpen,
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				{isMobile ? (
					<MobileSessionFiltersDrawer {...sharedProps} />
				) : (
					<DesktopSessionFilters {...sharedProps} />
				)}

				{hasActiveFilters && !isMobile && (
					<Button
						onClick={clearAllFilters}
						variant="outline"
						size="sm"
						className="h-9 border-[rgba(0,0,0,0.1)] bg-white text-[#4a5565] hover:bg-[#f9fafb] cursor-pointer"
					>
						Clear All
					</Button>
				)}
			</div>

			{/* Active Filters Display */}
			{hasActiveFilters && (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs text-[#6b7280]">Active filters:</span>
					{filters.types.map((type) => (
						<Badge
							key={type}
							className={`h-6 gap-1 rounded-md px-2 text-xs text-white ${getSessionTypeBadgeClass(
								type,
							)} hover:${getSessionTypeBadgeClass(type)}`}
						>
							{getSessionTypeLabel(type)}
							<button
								type="button"
								onClick={() => removeFilter("type", type)}
								className="ml-1 cursor-pointer hover:opacity-70"
							>
								<XIcon className="h-3 w-3" />
							</button>
						</Badge>
					))}
					{filters.statuses.map((status) => (
						<Badge
							key={status}
							className={`h-6 gap-1 rounded-md px-2 text-xs text-white ${getSessionStatusBadgeClass(
								status,
							)} hover:${getSessionStatusBadgeClass(status)}`}
						>
							{getSessionStatusLabel(status)}
							<button
								type="button"
								onClick={() => removeFilter("status", status)}
								className="ml-1 cursor-pointer hover:opacity-70"
							>
								<XIcon className="h-3 w-3" />
							</button>
						</Badge>
					))}
					{filters.dateFrom && (
						<Badge className="h-6 gap-1 rounded-md bg-[#6b7280] px-2 text-xs text-white hover:bg-[#6b7280]">
							From: {formatDateLabel(filters.dateFrom)}
							<button
								type="button"
								onClick={() => removeFilter("dateFrom", "")}
								className="ml-1 hover:opacity-70 cursor-pointer"
							>
								<XIcon className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{filters.dateTo && (
						<Badge className="h-6 gap-1 rounded-md bg-[#6b7280] px-2 text-xs text-white hover:bg-[#6b7280]">
							To: {formatDateLabel(filters.dateTo)}
							<button
								type="button"
								onClick={() => removeFilter("dateTo", "")}
								className="ml-1 hover:opacity-70 cursor-pointer"
							>
								<XIcon className="h-3 w-3" />
							</button>
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}
