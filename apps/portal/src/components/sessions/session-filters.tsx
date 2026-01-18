"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { useSessionFilters } from "@repo/ui/hooks";
import { FilterIcon, XIcon } from "@repo/ui/lib/lucide-react";
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

export function SessionFilters({ sortOrder }: SessionFiltersProps) {
	const { filters, updateFilters, resetFilters, getFilterCount } =
		useSessionFilters();

	// Local state for popover and form fields
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
		// Don't apply if date range is invalid
		if (isDateRangeInvalid) return;

		updateFilters({
			types: selectedTypes,
			statuses: selectedStatuses,
			dateFrom: dateFrom || null,
			dateTo: dateTo || null,
			sortOrder: sortOrder as "asc" | "desc",
		});
		setOpen(false);
	};

	const clearAllFilters = () => {
		setSelectedTypes([]);
		setSelectedStatuses([]);
		setDateFrom("");
		setDateTo("");
		resetFilters();
		setOpen(false);
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
		} else if (filterType === "dateFrom") {
			updateFilters({ dateFrom: null });
			setDateFrom("");
		} else if (filterType === "dateTo") {
			updateFilters({ dateTo: null });
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

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-9 gap-2 border-[rgba(0,0,0,0.1)] bg-white text-[#0a0a0a] hover:bg-[#f9fafb] cursor-pointer"
						>
							<FilterIcon className="h-4 w-4" />
							Filter
							{hasActiveFilters && (
								<Badge className="ml-1 h-5 w-5 rounded-full bg-[#a60202] p-0 text-[10px] text-white hover:bg-[#a60202]">
									{getFilterCount()}
								</Badge>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80" align="start">
						<div className="space-y-4">
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
													handleTypeChange(value, checked as boolean)
												}
											/>
											<span className="text-sm text-[#4a5565]">{label}</span>
										</label>
									))}
								</div>
							</div>

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
													handleStatusChange(value, checked as boolean)
												}
											/>
											<span className="text-sm text-[#4a5565]">{label}</span>
										</label>
									))}
								</div>
							</div>

							<div className="border-t border-[rgba(0,0,0,0.1)] pt-4">
								<h3 className="mb-3 text-sm font-semibold text-[#0a0a0a]">
									Date Range
								</h3>
								<div className="space-y-3">
									<div className="space-y-1.5">
										<label className="text-xs text-[#6b7280]">From</label>
										<input
											type="date"
											value={dateFrom}
											onChange={(e) => setDateFrom(e.target.value)}
											className="w-full h-9 px-3 text-sm border border-[rgba(0,0,0,0.1)] rounded-md focus:outline-none focus:ring-1 focus:ring-[#a60202]"
										/>
									</div>
									<div className="space-y-1.5">
										<label className="text-xs text-[#6b7280]">To</label>
										<input
											type="date"
											value={dateTo}
											onChange={(e) => setDateTo(e.target.value)}
											className="w-full h-9 px-3 text-sm border border-[rgba(0,0,0,0.1)] rounded-md focus:outline-none focus:ring-1 focus:ring-[#a60202]"
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

							<div className="flex gap-2 border-t border-[rgba(0,0,0,0.1)] pt-4">
								<Button
									onClick={applyFilters}
									size="sm"
									className="h-9 flex-1 cursor-pointer bg-[#a60202] text-white hover:bg-[#8a0101]"
									disabled={isDateRangeInvalid}
								>
									Apply Filters
								</Button>
								<Button
									onClick={() => {
										setSelectedTypes(filters.types);
										setSelectedStatuses(filters.statuses);
										setDateFrom(filters.dateFrom || "");
										setDateTo(filters.dateTo || "");
										setOpen(false);
									}}
									variant="outline"
									size="sm"
									className="h-9 cursor-pointer border-[rgba(0,0,0,0.1)]"
								>
									Cancel
								</Button>
							</div>
						</div>
					</PopoverContent>
				</Popover>

				{hasActiveFilters && (
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
