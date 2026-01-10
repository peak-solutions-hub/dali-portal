"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { FilterIcon, XIcon } from "@repo/ui/lib/lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface SessionFiltersProps {
	sortOrder: string;
}

export function SessionFilters({ sortOrder }: SessionFiltersProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Get current filters from URL
	const currentTypes = searchParams.getAll("type");
	const currentStatuses = searchParams.getAll("status");
	const currentDateFrom = searchParams.get("dateFrom") || "";
	const currentDateTo = searchParams.get("dateTo") || "";

	// Local state for filter selections
	const [selectedTypes, setSelectedTypes] = useState<string[]>(currentTypes);
	const [selectedStatuses, setSelectedStatuses] =
		useState<string[]>(currentStatuses);
	const [dateFrom, setDateFrom] = useState(currentDateFrom);
	const [dateTo, setDateTo] = useState(currentDateTo);
	const [open, setOpen] = useState(false);

	const hasActiveFilters =
		currentTypes.length > 0 ||
		currentStatuses.length > 0 ||
		currentDateFrom ||
		currentDateTo;

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

		const params = new URLSearchParams();
		params.set("view", "list");
		params.set("page", "1");
		params.set("sort", sortOrder);

		// Add multiple type filters
		for (const type of selectedTypes) {
			params.append("type", type);
		}

		// Add multiple status filters
		for (const status of selectedStatuses) {
			params.append("status", status);
		}

		if (dateFrom) {
			params.set("dateFrom", dateFrom);
		}

		if (dateTo) {
			params.set("dateTo", dateTo);
		}

		router.push(`/sessions?${params.toString()}`);
		setOpen(false);
	};

	const clearAllFilters = () => {
		setSelectedTypes([]);
		setSelectedStatuses([]);
		setDateFrom("");
		setDateTo("");
		router.push(`/sessions?view=list&page=1&sort=${sortOrder}`);
		setOpen(false);
	};

	const removeFilter = (
		filterType: "type" | "status" | "dateFrom" | "dateTo",
		value: string,
	) => {
		const params = new URLSearchParams();
		params.set("view", searchParams.get("view") || "list");
		params.set("page", "1");
		params.set("sort", searchParams.get("sort") || "desc");

		if (filterType === "type") {
			const types = currentTypes.filter((t) => t !== value);
			for (const type of types) {
				params.append("type", type);
			}
			for (const status of currentStatuses) {
				params.append("status", status);
			}
		} else if (filterType === "status") {
			const statuses = currentStatuses.filter((s) => s !== value);
			for (const type of currentTypes) {
				params.append("type", type);
			}
			for (const status of statuses) {
				params.append("status", status);
			}
		} else {
			for (const type of currentTypes) {
				params.append("type", type);
			}
			for (const status of currentStatuses) {
				params.append("status", status);
			}
		}

		if (filterType !== "dateFrom" && currentDateFrom) {
			params.set("dateFrom", currentDateFrom);
		}
		if (filterType !== "dateTo" && currentDateTo) {
			params.set("dateTo", currentDateTo);
		}

		router.push(`/sessions?${params.toString()}`);
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
									{currentTypes.length +
										currentStatuses.length +
										(currentDateFrom ? 1 : 0) +
										(currentDateTo ? 1 : 0)}
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
									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={selectedTypes.includes("regular")}
											onCheckedChange={(checked) =>
												handleTypeChange("regular", checked as boolean)
											}
										/>
										<span className="text-sm text-[#4a5565]">
											Regular Session
										</span>
									</label>
									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={selectedTypes.includes("special")}
											onCheckedChange={(checked) =>
												handleTypeChange("special", checked as boolean)
											}
										/>
										<span className="text-sm text-[#4a5565]">
											Special Session
										</span>
									</label>
								</div>
							</div>

							<div className="border-t border-[rgba(0,0,0,0.1)] pt-4">
								<h3 className="mb-3 text-sm font-semibold text-[#0a0a0a]">
									Status
								</h3>
								<div className="space-y-2">
									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={selectedStatuses.includes("completed")}
											onCheckedChange={(checked) =>
												handleStatusChange("completed", checked as boolean)
											}
										/>
										<span className="text-sm text-[#4a5565]">Completed</span>
									</label>
									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={selectedStatuses.includes("scheduled")}
											onCheckedChange={(checked) =>
												handleStatusChange("scheduled", checked as boolean)
											}
										/>
										<span className="text-sm text-[#4a5565]">Scheduled</span>
									</label>
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

							<div className="border-t border-[rgba(0,0,0,0.1)] pt-4 flex gap-2">
								<Button
									onClick={applyFilters}
									size="sm"
									className="flex-1 h-9 bg-[#a60202] text-white hover:bg-[#8a0101] cursor-pointer"
									disabled={isDateRangeInvalid}
								>
									Apply Filters
								</Button>
								<Button
									onClick={() => {
										setSelectedTypes(currentTypes);
										setSelectedStatuses(currentStatuses);
										setDateFrom(currentDateFrom);
										setDateTo(currentDateTo);
										setOpen(false);
									}}
									variant="outline"
									size="sm"
									className="h-9 border-[rgba(0,0,0,0.1)] cursor-pointer"
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
					{currentTypes.map((type) => (
						<Badge
							key={type}
							className="h-6 gap-1 rounded-md bg-[#dc2626] px-2 text-xs text-white hover:bg-[#dc2626]"
						>
							{type === "regular" ? "Regular" : "Special"}
							<button
								type="button"
								onClick={() => removeFilter("type", type)}
								className="ml-1 hover:opacity-70 cursor-pointer"
							>
								<XIcon className="h-3 w-3" />
							</button>
						</Badge>
					))}
					{currentStatuses.map((status) => (
						<Badge
							key={status}
							className={`h-6 gap-1 rounded-md px-2 text-xs text-white ${
								status === "completed"
									? "bg-[#16a34a] hover:bg-[#16a34a]"
									: "bg-[#3b82f6] hover:bg-[#3b82f6]"
							}`}
						>
							{status === "completed" ? "Completed" : "Scheduled"}
							<button
								type="button"
								onClick={() => removeFilter("status", status)}
								className="ml-1 hover:opacity-70 cursor-pointer"
							>
								<XIcon className="h-3 w-3" />
							</button>
						</Badge>
					))}
					{currentDateFrom && (
						<Badge className="h-6 gap-1 rounded-md bg-[#6b7280] px-2 text-xs text-white hover:bg-[#6b7280]">
							From: {formatDateLabel(currentDateFrom)}
							<button
								type="button"
								onClick={() => removeFilter("dateFrom", "")}
								className="ml-1 hover:opacity-70 cursor-pointer"
							>
								<XIcon className="h-3 w-3" />
							</button>
						</Badge>
					)}
					{currentDateTo && (
						<Badge className="h-6 gap-1 rounded-md bg-[#6b7280] px-2 text-xs text-white hover:bg-[#6b7280]">
							To: {formatDateLabel(currentDateTo)}
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
