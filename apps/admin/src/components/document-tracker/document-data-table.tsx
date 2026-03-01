"use client";

import {
	DOCUMENT_TYPE_VALUES,
	type DocumentSortBy,
	STATUS_TYPE_VALUES,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DateRangePickerField } from "@repo/ui/components/date-range-picker-field";
import { Input } from "@repo/ui/components/input";
import { PaginationControl } from "@repo/ui/components/pagination-control";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Separator } from "@repo/ui/components/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { useDebounce } from "@repo/ui/hooks/use-debounce";
import {
	ArrowUpDown,
	ClipboardList,
	Loader2,
	Plus,
} from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GenerateCallerSlipDialog } from "@/components/caller-slips/generate-caller-slip-dialog";
import { useDocuments } from "@/hooks/document-tracker/use-documents";
import { useDocumentStore } from "@/stores/document-store";
import {
	formatDocumentSource,
	formatDocumentStatus,
	formatDocumentType,
} from "@/utils/document-helpers";
import { DocumentStatusBadge } from "./document-status-badge";
import { DocumentTypeIndicator } from "./document-type-indicator";
import { LogDocumentDialog } from "./log-document-dialog";

const TAB_OPTIONS = [
	{ value: "all", label: "All Documents" },
	{ value: "legislative", label: "Legislative" },
	{ value: "administrative", label: "Administrative" },
	{ value: "invitations", label: "Invitations" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

const SORTABLE_COLUMNS: Array<{ key: DocumentSortBy; label: string }> = [
	{ key: "codeNumber", label: "Tracking No." },
	{ key: "title", label: "Title / Particulars" },
	{ key: "source", label: "Source" },
	{ key: "type", label: "Type" },
	{ key: "status", label: "Status" },
	{ key: "receivedAt", label: "Date Received" },
];

export function DocumentDataTable() {
	const router = useRouter();
	const {
		activeTab,
		search,
		statusFilter,
		typeFilter,
		dateFrom,
		dateTo,
		page,
		limit,
		sortBy,
		sortOrder,
		selectedInvitationIds,
		setActiveTab,
		setSearch,
		setStatusFilter,
		setTypeFilter,
		setDateFrom,
		setDateTo,
		setPage,
		setLimit,
		setSort,
		clearFilters,
		toggleInvitationSelection,
		setSelectedInvitationIds,
		clearInvitationSelection,
	} = useDocumentStore();

	const [searchInput, setSearchInput] = useState(search);
	const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
	const [isGenerateSlipOpen, setIsGenerateSlipOpen] = useState(false);
	const debouncedSearch = useDebounce(searchInput, 300);

	useEffect(() => {
		setSearch(debouncedSearch.trim());
	}, [debouncedSearch, setSearch]);

	const { data, isLoading, error, refetch, isPlaceholderData } = useDocuments();

	const items = data?.items ?? [];
	const pagination =
		data?.pagination ??
		({
			total: 0,
			page: 1,
			limit,
			totalPages: 0,
		} as const);

	const hasActiveFilters = useMemo(
		() =>
			search.length > 0 ||
			statusFilter !== "all" ||
			typeFilter !== "all" ||
			dateFrom !== null ||
			dateTo !== null ||
			activeTab !== "all",
		[search, statusFilter, typeFilter, dateFrom, dateTo, activeTab],
	);

	const toggleSort = (column: DocumentSortBy) => {
		if (sortBy === column) {
			setSort(column, sortOrder === "asc" ? "desc" : "asc");
			return;
		}

		setSort(column, "asc");
	};

	const openDocumentDetail = (id: string) => {
		router.push(`/document-tracker/${id}`);
	};

	const isInvitationsTab = activeTab === "invitations";

	// For invitations tab: filter selectable items (unassigned only)
	const selectableItems = useMemo(
		() => (isInvitationsTab ? items.filter((item) => !item.callerSlipId) : []),
		[items, isInvitationsTab],
	);

	const allSelectableChecked =
		selectableItems.length > 0 &&
		selectableItems.every((item) => selectedInvitationIds.includes(item.id));

	const someSelectableChecked =
		selectableItems.some((item) => selectedInvitationIds.includes(item.id)) &&
		!allSelectableChecked;

	const selectedDocuments = useMemo(
		() => items.filter((item) => selectedInvitationIds.includes(item.id)),
		[items, selectedInvitationIds],
	);

	const handleSelectAll = () => {
		if (allSelectableChecked) {
			clearInvitationSelection();
		} else {
			setSelectedInvitationIds(selectableItems.map((item) => item.id));
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold">Document Tracker</h1>
				<p className="text-sm text-muted-foreground">
					Manage and track legislative and administrative documents.
				</p>
			</div>

			{/* Batch Toolbar for Invitations Tab */}
			{isInvitationsTab && selectedInvitationIds.length > 0 && (
				<Card className="flex items-center justify-between gap-3 border-primary/20 bg-primary/5 p-3">
					<span className="text-sm font-medium">
						{selectedInvitationIds.length} invitation
						{selectedInvitationIds.length > 1 ? "s" : ""} selected
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={clearInvitationSelection}
						>
							Clear
						</Button>
						<Button size="sm" onClick={() => setIsGenerateSlipOpen(true)}>
							<ClipboardList className="mr-2 h-4 w-4" />
							Generate Caller&apos;s Slip
						</Button>
					</div>
				</Card>
			)}

			<Card className="flex flex-col gap-4 p-6">
				{/* Filter Bar */}
				<div className="flex flex-wrap items-center gap-2">
					<Input
						placeholder="Search documents..."
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
						className="w-70"
					/>

					<Tabs
						value={activeTab}
						onValueChange={(value) =>
							setActiveTab(value as (typeof TAB_OPTIONS)[number]["value"])
						}
					>
						<TabsList>
							{TAB_OPTIONS.map((tab) => (
								<TabsTrigger key={tab.value} value={tab.value}>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>

					<Separator orientation="vertical" className="mx-1 h-6" />

					<Select
						value={statusFilter}
						onValueChange={(value) =>
							setStatusFilter(
								value === "all"
									? "all"
									: (value as (typeof STATUS_TYPE_VALUES)[number]),
							)
						}
					>
						<SelectTrigger className="w-32.5">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							{STATUS_TYPE_VALUES.map((status) => (
								<SelectItem key={status} value={status}>
									{formatDocumentStatus(status)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={typeFilter}
						onValueChange={(value) =>
							setTypeFilter(
								value === "all"
									? "all"
									: (value as (typeof DOCUMENT_TYPE_VALUES)[number]),
							)
						}
					>
						<SelectTrigger className="w-30">
							<SelectValue placeholder="Type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							{DOCUMENT_TYPE_VALUES.map((type) => (
								<SelectItem key={type} value={type}>
									{formatDocumentType(type)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<DateRangePickerField
						from={dateFrom}
						to={dateTo}
						onChange={(from, to) => {
							setDateFrom(from);
							setDateTo(to);
						}}
						placeholder="Pick a date range"
						className="w-60"
					/>

					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								clearFilters();
								setSearchInput("");
							}}
						>
							Clear Filters
						</Button>
					)}

					<div className="ml-auto">
						<Button onClick={() => setIsLogDialogOpen(true)}>
							<Plus className="size-4" />
							Log Document
						</Button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-hidden rounded-md border">
					{isLoading ? (
						<div className="flex h-56 items-center justify-center gap-2 text-muted-foreground">
							<Loader2 className="size-4 animate-spin" />
							<span>Loading documents...</span>
						</div>
					) : error ? (
						<div className="flex h-56 flex-col items-center justify-center gap-3 px-4 text-center">
							<p className="text-sm text-destructive">
								Failed to load documents. Please try again.
							</p>
							<Button variant="outline" onClick={() => refetch()}>
								Retry
							</Button>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											{isInvitationsTab && (
												<TableHead className="w-10">
													<Checkbox
														checked={
															allSelectableChecked
																? true
																: someSelectableChecked
																	? "indeterminate"
																	: false
														}
														onCheckedChange={handleSelectAll}
														aria-label="Select all invitations"
														disabled={selectableItems.length === 0}
													/>
												</TableHead>
											)}
											{SORTABLE_COLUMNS.map((column) => (
												<TableHead key={column.key}>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => toggleSort(column.key)}
														className="-ml-2"
													>
														{column.label}
														<ArrowUpDown className="size-3.5" />
													</Button>
												</TableHead>
											))}
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{items.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={isInvitationsTab ? 8 : 7}
													className="h-32 text-center text-muted-foreground"
												>
													No documents match your filters.
												</TableCell>
											</TableRow>
										) : (
											items.map((item) => {
												const isAssigned = Boolean(item.callerSlipId);
												const isSelected = selectedInvitationIds.includes(
													item.id,
												);

												return (
													<TableRow
														key={item.id}
														onClick={() => openDocumentDetail(item.id)}
														onKeyDown={(event) => {
															if (event.key === "Enter" || event.key === " ") {
																event.preventDefault();
																openDocumentDetail(item.id);
															}
														}}
														className="cursor-pointer"
														tabIndex={0}
													>
														{isInvitationsTab && (
															<TableCell onClick={(e) => e.stopPropagation()}>
																{isAssigned ? (
																	<Tooltip>
																		<TooltipTrigger asChild>
																			<div>
																				<Checkbox
																					disabled
																					aria-label="Already assigned to a Caller's Slip"
																				/>
																			</div>
																		</TooltipTrigger>
																		<TooltipContent>
																			Already assigned to a Caller&apos;s Slip
																		</TooltipContent>
																	</Tooltip>
																) : (
																	<Checkbox
																		checked={isSelected}
																		onCheckedChange={() =>
																			toggleInvitationSelection(item.id)
																		}
																		aria-label={`Select ${item.title}`}
																	/>
																)}
															</TableCell>
														)}
														<TableCell className="font-mono text-xs">
															{item.codeNumber}
														</TableCell>
														<TableCell className="font-medium">
															{item.title}
														</TableCell>
														<TableCell>
															{formatDocumentSource(item.source)}
														</TableCell>
														<TableCell>
															<DocumentTypeIndicator type={item.type} />
														</TableCell>
														<TableCell>
															<DocumentStatusBadge status={item.status} />
														</TableCell>
														<TableCell>
															{new Date(item.receivedAt).toLocaleDateString(
																"en-PH",
																{
																	year: "numeric",
																	month: "short",
																	day: "numeric",
																},
															)}
														</TableCell>
														<TableCell className="text-right">
															<Button
																variant="ghost"
																size="sm"
																onClick={(event) => {
																	event.stopPropagation();
																	openDocumentDetail(item.id);
																}}
															>
																View
															</Button>
														</TableCell>
													</TableRow>
												);
											})
										)}
									</TableBody>
								</Table>
							</div>

							<div className="border-t p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
								<div className="flex items-center gap-2">
									<span className="text-sm text-muted-foreground">
										Rows per page
									</span>
									<Select
										value={String(limit)}
										onValueChange={(value) => setLimit(Number(value))}
									>
										<SelectTrigger size="sm" className="w-20">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{PAGE_SIZE_OPTIONS.map((size) => (
												<SelectItem key={size} value={String(size)}>
													{size}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{isPlaceholderData && (
										<span className="text-xs text-muted-foreground">
											Refreshing...
										</span>
									)}
								</div>

								<PaginationControl
									totalItems={pagination.total}
									itemsPerPage={pagination.limit}
									currentPage={page}
									onPageChange={setPage}
								/>
							</div>
						</>
					)}
				</div>
			</Card>

			<LogDocumentDialog
				open={isLogDialogOpen}
				onOpenChange={setIsLogDialogOpen}
				onCreated={async () => {
					await refetch();
				}}
			/>

			<GenerateCallerSlipDialog
				open={isGenerateSlipOpen}
				onOpenChange={setIsGenerateSlipOpen}
				selectedDocuments={selectedDocuments}
			/>
		</div>
	);
}
