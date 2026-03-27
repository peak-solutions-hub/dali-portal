"use client";

import { isDefinedError } from "@orpc/client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Download, FileText, Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api, orpc } from "@/lib/api.client";
import { DatePickerField } from "./date-picker-field";

type VisitorLogEntry = {
	id: string;
	dateVisited: string;
	constituentName: string;
	purpose: string;
	affiliation: string | null;
	remarks: string | null;
	loggedBy: string;
};

function formatDateTime(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	});
}

function getComparableDate(isoString: string): string {
	return new Date(isoString).toLocaleDateString("en-CA");
}

function formatDisplayDate(dateInput: string | Date): string {
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

function getTodayDateInput(): string {
	return new Date().toLocaleDateString("en-CA");
}

function isWithinLastNDays(isoString: string, days: number): boolean {
	const visit = new Date(isoString);
	const now = new Date();
	const diff = now.getTime() - visit.getTime();
	return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function startOfDayMs(date: Date): number {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy.getTime();
}

function endOfDayMs(date: Date): number {
	const copy = new Date(date);
	copy.setHours(23, 59, 59, 999);
	return copy.getTime();
}

const INITIAL_VISITOR_FORM_STATE = {
	familyName: "",
	firstName: "",
	contactNumber: "",
	affiliation: "",
	purpose: "",
};

export function VisitorLogs() {
	const queryClient = useQueryClient();
	const visitorLogsQuery = orpc.visitorLogs.list.queryOptions();
	const { data: visitorLogsData, isLoading } = useQuery<VisitorLogEntry[]>({
		...visitorLogsQuery,
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
	const visitorLogs = visitorLogsData ?? [];
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [formState, setFormState] = useState(INITIAL_VISITOR_FORM_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const [filterType, setFilterType] = useState<
		"none" | "today" | "last7" | "range"
	>("none");
	const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
	const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);
	const [dateOrder, setDateOrder] = useState<"desc" | "asc">("desc");
	const [alphaOrder, setAlphaOrder] = useState<"none" | "asc" | "desc">("none");
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	const handleInputChange = (field: keyof typeof formState, value: string) => {
		setFormState((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const [error] = await api.visitorLogs.create({
			familyName: formState.familyName,
			firstName: formState.firstName,
			contactNumber: formState.contactNumber,
			affiliation: formState.affiliation,
			purpose: formState.purpose,
		});

		if (error) {
			setFormError(
				isDefinedError(error) ? error.message : "Failed to save visitor log.",
			);
			return;
		}

		setFormError(null);
		toast.success("Visitor added.");
		await queryClient.invalidateQueries({
			queryKey: visitorLogsQuery.queryKey,
		});
		setFormState(INITIAL_VISITOR_FORM_STATE);
		setIsDialogOpen(false);
	};

	const handleQuickFilter = (type: "today" | "last7") => {
		setFilterType(type);
		setRangeStart(undefined);
		setRangeEnd(undefined);
	};

	const handleRangeChange = (
		field: "start" | "end",
		value: Date | undefined,
	) => {
		if (field === "start") {
			setRangeStart(value);
		} else {
			setRangeEnd(value);
		}

		const nextStart = field === "start" ? value : rangeStart;
		const nextEnd = field === "end" ? value : rangeEnd;
		setFilterType(nextStart || nextEnd ? "range" : "none");
	};

	const clearFilters = () => {
		setFilterType("none");
		setRangeStart(undefined);
		setRangeEnd(undefined);
		setIsFilterOpen(false);
	};

	const applyFilters = () => {
		setIsFilterOpen(false);
	};

	const toggleAlphabeticalOrder = () => {
		setAlphaOrder((prev) => {
			if (prev === "none") return "asc";
			if (prev === "asc") return "desc";
			return "none";
		});
	};

	const totalVisits = visitorLogs.length;
	const hasRangeValues = Boolean(rangeStart || rangeEnd);
	const filterCount =
		filterType === "none"
			? 0
			: filterType === "range"
				? hasRangeValues
					? 1
					: 0
				: 1;
	const hasActiveFilters = filterCount > 0;
	const filteredLogs = useMemo(() => {
		let data = [...visitorLogs];

		if (filterType === "today") {
			const today = getTodayDateInput();
			data = data.filter((log) => getComparableDate(log.dateVisited) === today);
		} else if (filterType === "last7") {
			data = data.filter((log) => isWithinLastNDays(log.dateVisited, 7));
		} else if (filterType === "range" && hasRangeValues) {
			const startMs = rangeStart ? startOfDayMs(rangeStart) : null;
			const endMs = rangeEnd ? endOfDayMs(rangeEnd) : null;

			data = data.filter((log) => {
				const visitMs = new Date(log.dateVisited).getTime();
				if (startMs !== null && visitMs < startMs) return false;
				if (endMs !== null && visitMs > endMs) return false;
				return true;
			});
		}

		data.sort((a, b) => {
			if (alphaOrder !== "none") {
				return alphaOrder === "asc"
					? a.constituentName.localeCompare(b.constituentName)
					: b.constituentName.localeCompare(a.constituentName);
			}

			const diff =
				new Date(a.dateVisited).getTime() - new Date(b.dateVisited).getTime();
			return dateOrder === "desc" ? -diff : diff;
		});

		return data;
	}, [filterType, rangeStart, rangeEnd, alphaOrder, dateOrder, visitorLogs]);

	const activeDateLabel = (() => {
		if (filterType === "today") {
			return formatDisplayDate(getTodayDateInput());
		}
		if (filterType === "last7") {
			return "Last 7 days";
		}
		if (filterType === "range" && hasRangeValues) {
			if (rangeStart && rangeEnd) {
				return `${formatDisplayDate(rangeStart)} - ${formatDisplayDate(rangeEnd)}`;
			}
			if (rangeStart) {
				return `From ${formatDisplayDate(rangeStart)}`;
			}
			if (rangeEnd) {
				return `Until ${formatDisplayDate(rangeEnd)}`;
			}
		}
		return "All Dates";
	})();

	return (
		<div className="space-y-6">
			{/* Stats Card */}
			<Card className="w-fit px-6 py-4 border border-gray-200 shadow-sm">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
						<FileText className="h-6 w-6 text-emerald-600" />
					</div>
					<div>
						<p className="text-sm text-gray-500">Total Visits</p>
						<p className="text-2xl font-semibold text-gray-900">
							{totalVisits}
						</p>
					</div>
				</div>
			</Card>

			<div className="space-y-4">
				<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
					<p className="text-sm text-gray-500">
						All visitor entries appear in this log. Beneficiary records are
						managed separately.
					</p>
					<p className="text-sm text-gray-500">
						Showing {filteredLogs.length} of {totalVisits} records
					</p>
				</div>
				<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
					<div className="flex flex-wrap items-center gap-3">
						<div>
							<span className="sr-only">Sort by visit date</span>
							<Select
								value={dateOrder}
								onValueChange={(value) => setDateOrder(value as "asc" | "desc")}
							>
								<SelectTrigger className="h-10 min-w-35 justify-between rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm focus:ring-2 focus:ring-gray-200">
									<SelectValue placeholder="Sort by date" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="desc">Latest</SelectItem>
									<SelectItem value="asc">Oldest</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
								>
									<Filter className="h-4 w-4 text-gray-800" />
									Filter
									{hasActiveFilters && (
										<Badge className="ml-1 h-5 rounded-full bg-[#a60202] px-2 py-0 text-[11px] text-white">
											{filterCount}
										</Badge>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-72" align="start">
								<div className="space-y-4">
									<div className="space-y-2">
										<p className="text-sm font-semibold text-gray-900">
											Quick filters
										</p>
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												variant={filterType === "today" ? "default" : "outline"}
												className={`rounded-full px-4 text-sm font-medium shadow-sm ${
													filterType === "today"
														? "bg-[#a60202] text-white hover:bg-[#8a0101]"
														: "border border-gray-200 text-gray-900 hover:bg-gray-50"
												}`}
												onClick={() => handleQuickFilter("today")}
											>
												Today
											</Button>
											<Button
												type="button"
												variant={filterType === "last7" ? "default" : "outline"}
												className={`rounded-full px-4 text-sm font-medium shadow-sm ${
													filterType === "last7"
														? "bg-[#a60202] text-white hover:bg-[#8a0101]"
														: "border border-gray-200 text-gray-900 hover:bg-gray-50"
												}`}
												onClick={() => handleQuickFilter("last7")}
											>
												Last 7 days
											</Button>
										</div>
									</div>
									<div className="space-y-3 border-t border-gray-100 pt-3">
										<p className="text-sm font-semibold text-gray-900">
											Date Range
										</p>
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<DatePickerField
												label="From"
												date={rangeStart}
												onSelect={(date) => handleRangeChange("start", date)}
												disabled={(date) =>
													Boolean(rangeEnd && date > rangeEnd)
												}
											/>
											<DatePickerField
												label="To"
												date={rangeEnd}
												onSelect={(date) => handleRangeChange("end", date)}
												disabled={(date) =>
													Boolean(rangeStart && date < rangeStart)
												}
											/>
										</div>
										<p className="text-xs text-gray-500">
											Setting from/to automatically applies the range filter.
										</p>
									</div>
									<div className="flex gap-3">
										<Button
											type="button"
											variant="outline"
											className="flex-1"
											onClick={clearFilters}
											disabled={!hasActiveFilters}
										>
											Clear
										</Button>
										<Button
											type="button"
											className="flex-1 bg-[#a60202] text-white hover:bg-[#8a0101]"
											onClick={applyFilters}
										>
											Apply
										</Button>
									</div>
								</div>
							</PopoverContent>
						</Popover>
						<Button
							type="button"
							variant="outline"
							aria-pressed={alphaOrder !== "none"}
							onClick={toggleAlphabeticalOrder}
							title={
								alphaOrder === "desc"
									? "Alphabetical (Z to A)"
									: alphaOrder === "asc"
										? "Alphabetical (A to Z)"
										: "Alphabetical (default)"
							}
							className={`gap-2 rounded-full border px-4 text-sm font-medium shadow-sm transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-200 ${
								alphaOrder !== "none"
									? "border-gray-300 bg-gray-50 text-gray-900"
									: "border-gray-200 bg-white text-gray-900"
							}`}
						>
							<span>Alphabetical</span>
							<ArrowUpDown
								className={`h-4 w-4 text-gray-800 transition-transform ${
									alphaOrder === "desc" ? "rotate-180" : ""
								}`}
							/>
						</Button>
					</div>
					<div className="flex flex-wrap gap-3 justify-end">
						<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
							<Button
								onClick={() => setIsDialogOpen(true)}
								className="gap-2 rounded-md bg-[#a60202] px-5 py-2 text-white shadow-sm transition hover:bg-[#8a0101]"
							>
								<Plus className="h-4 w-4" />
								Add Visitor
							</Button>
							<DialogContent className="sm:max-w-2xl">
								<DialogHeader>
									<DialogTitle>Log Visitor</DialogTitle>
									<DialogDescription>
										Fill in the visitor details to add them to the log.
									</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleSubmit} className="space-y-4">
									{formError && (
										<p className="text-sm text-red-600">{formError}</p>
									)}
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div>
											<label className="text-sm font-medium text-gray-700">
												Family Name <span className="text-red-500">*</span>
											</label>
											<Input
												value={formState.familyName}
												onChange={(e) =>
													handleInputChange("familyName", e.target.value)
												}
												placeholder="Enter family name"
												required
											/>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												First Name <span className="text-red-500">*</span>
											</label>
											<Input
												value={formState.firstName}
												onChange={(e) =>
													handleInputChange("firstName", e.target.value)
												}
												placeholder="Enter first name"
												required
											/>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Contact Number <span className="text-red-500">*</span>
											</label>
											<div className="flex items-center overflow-hidden rounded-md border border-input bg-transparent shadow-xs">
												<span className="border-r bg-muted px-3 py-2 text-sm text-muted-foreground">
													+63
												</span>
												<Input
													className="border-0 shadow-none focus-visible:ring-0"
													value={formState.contactNumber}
													onChange={(event) =>
														handleInputChange(
															"contactNumber",
															event.target.value
																.replace(/\D/g, "")
																.slice(0, 10),
														)
													}
													placeholder="9XXXXXXXXX"
													inputMode="numeric"
													pattern="9[0-9]{9}"
													maxLength={10}
													autoComplete="tel-national"
													title="Enter a valid Philippine mobile number (e.g., 9XXXXXXXXX)."
													required
												/>
											</div>
										</div>
									</div>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div>
											<label className="text-sm font-medium text-gray-700">
												Affiliation / Barangay
											</label>
											<Input
												value={formState.affiliation}
												onChange={(e) =>
													handleInputChange("affiliation", e.target.value)
												}
												placeholder="e.g. Barangay Molo"
											/>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Purpose of Visit <span className="text-red-500">*</span>
											</label>
											<Input
												value={formState.purpose}
												onChange={(e) =>
													handleInputChange("purpose", e.target.value)
												}
												placeholder="e.g. Assistance request"
												required
											/>
										</div>
									</div>
									<DialogFooter>
										<Button
											type="button"
											variant="ghost"
											onClick={() => setIsDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button type="submit">Save Visitor</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
						<Button
							variant="outline"
							className="gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
						>
							<Download className="h-4 w-4" />
							Export Visitor Logs
						</Button>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1">
				<p className="text-sm font-medium text-gray-900">
					Showing {filteredLogs.length} visits — {activeDateLabel}
				</p>
				<p className="text-xs text-gray-500">
					Dates are shown in Philippine Time.
				</p>
			</div>

			{/* Visitor Logs Table */}
			<div className="rounded-lg border border-gray-200 overflow-hidden">
				<Table>
					<TableHeader className="bg-gray-50">
						<TableRow className="border-b border-gray-200 hover:bg-gray-50">
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Constituent
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Purpose
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Affiliation
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 min-w-64">
								Remarks
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-48">
								Date/Time
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-36">
								Logged By
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow className="border-b border-gray-200 bg-white">
								<TableCell
									colSpan={6}
									className="px-6 py-10 text-center text-sm text-gray-500"
								>
									Loading visitor logs...
								</TableCell>
							</TableRow>
						) : filteredLogs.length === 0 ? (
							<TableRow className="border-b border-gray-200 bg-white">
								<TableCell
									colSpan={6}
									className="px-6 py-10 text-center text-sm text-gray-500"
								>
									{hasActiveFilters
										? "No visitors match the selected filters."
										: "No visitors have been logged yet."}
								</TableCell>
							</TableRow>
						) : (
							filteredLogs.map((log, index) => (
								<TableRow
									key={log.id}
									className={`border-b border-gray-200 hover:bg-gray-50/50 ${
										index % 2 === 1 ? "bg-gray-50/30" : "bg-white"
									}`}
								>
									<TableCell className="px-6 py-4 text-sm font-medium text-gray-900">
										{log.constituentName}
									</TableCell>
									<TableCell className="px-6 py-4 text-sm text-gray-900">
										{log.purpose}
									</TableCell>
									<TableCell className="px-6 py-4 text-sm text-gray-500">
										{log.affiliation ?? "-"}
									</TableCell>
									<TableCell className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
										{log.remarks}
									</TableCell>
									<TableCell className="px-6 py-4 text-sm text-gray-900">
										{formatDateTime(log.dateVisited)}
									</TableCell>
									<TableCell className="px-6 py-4 text-sm text-gray-900">
										{log.loggedBy}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
