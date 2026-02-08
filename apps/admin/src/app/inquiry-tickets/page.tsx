"use client";

import { isDefinedError } from "@orpc/client";
import type { InquiryStatus, InquiryTicketResponse } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { Bell, Loader2, MessageCircle, Search, Tag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { InquiryStatusBadge } from "@/components/inquiry-tickets/inquiry-status-badge";
import { InquiryTicketSheet } from "@/components/inquiry-tickets/inquiry-ticket-sheet";
import { PaginationControls } from "@/components/inquiry-tickets/pagination-controls";
import { api } from "@/lib/api.client";
import { formatInquiryCategory } from "@/utils/inquiry-helpers";
export default function InquiryTicketsPage() {
	const [selectedStatus, setSelectedStatus] = useState<string>("new");
	const [searchQuery, _setSearchQuery] = useState("");
	const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
	const [tickets, setTickets] = useState<InquiryTicketResponse[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 0,
		totalItems: 0,
		itemsPerPage: 20,
		hasNextPage: false,
		hasPreviousPage: false,
	});
	const [statusCounts, setStatusCounts] = useState({
		all: 0,
		new: 0,
		open: 0,
		waiting_for_citizen: 0,
		resolved: 0,
		rejected: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch status counts (refreshes with tickets)
	const fetchStatusCounts = async () => {
		const statuses: (InquiryStatus | "all")[] = [
			"all",
			"new",
			"open",
			"waiting_for_citizen",
			"resolved",
			"rejected",
		];

		const counts = {
			all: 0,
			new: 0,
			open: 0,
			waiting_for_citizen: 0,
			resolved: 0,
			rejected: 0,
		};

		// Fetch all counts in parallel for better performance
		const results = await Promise.all(
			statuses.map((status) =>
				api.inquiries.getList({
					limit: 1,
					page: 1,
					...(status !== "all" && { status: status as InquiryStatus }),
				}),
			),
		);

		results.forEach(([err, result], index) => {
			const status = statuses[index];
			if (!err && result && status) {
				counts[status] = result.pagination.totalItems;
			}
		});

		setStatusCounts(counts);
	};

	// Fetch tickets when status or page changes
	useEffect(() => {
		async function fetchTickets() {
			setIsLoading(true);
			setError(null);

			const [err, result] = await api.inquiries.getList({
				limit: 20,
				page: currentPage,
				...(selectedStatus !== "all" && {
					status: selectedStatus as InquiryStatus,
				}),
			});

			if (err) {
				if (isDefinedError(err)) {
					setError(err.message);
				} else {
					setError("Failed to fetch inquiry tickets");
				}
				setIsLoading(false);
				return;
			}

			setTickets(result?.tickets || []);
			setPagination(result?.pagination || pagination);

			// Refresh status counts after fetching tickets
			await fetchStatusCounts();

			setIsLoading(false);
		}

		fetchTickets();
	}, [selectedStatus, currentPage]); // Re-fetch when status or page changes

	// Filter tickets by search query only (status filtering is server-side)
	const filteredTickets = tickets.filter((ticket) => {
		const matchesSearch =
			searchQuery === "" ||
			ticket.referenceNumber
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			ticket.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesSearch;
	});

	// Reset to page 1 when changing status
	const handleStatusChange = (status: string) => {
		setSelectedStatus(status);
		setCurrentPage(1);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	return (
		<>
			<div className="flex-1 flex flex-col h-full">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight p-6 pt-2">
						Inquiry Tickets
					</h1>
				</div>
				{/* Sticky Status Tabs */}
				<div className="sticky top-0 z-10 p-6 pb-4 pt-0">
					<Tabs value={selectedStatus} onValueChange={handleStatusChange}>
						<TabsList>
							<TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
							<TabsTrigger value="new">New ({statusCounts.new})</TabsTrigger>
							<TabsTrigger value="open">Open ({statusCounts.open})</TabsTrigger>
							<TabsTrigger value="waiting_for_citizen">
								Waiting ({statusCounts.waiting_for_citizen})
							</TabsTrigger>
							<TabsTrigger value="resolved">
								Resolved ({statusCounts.resolved})
							</TabsTrigger>
							<TabsTrigger value="rejected">
								Rejected ({statusCounts.rejected})
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* Table Card with internal scroll */}
				<div className="p-6 pt-0 flex-1 flex flex-col min-h-0">
					<Card className="flex-1 flex flex-col overflow-hidden min-h-0 p-0">
						{/* Pagination at top */}
						{pagination.totalPages > 0 && (
							<div className="bg-white border-b">
								<PaginationControls
									pagination={pagination}
									onPageChange={handlePageChange}
								/>
							</div>
						)}
						{/* Loading State */}
						{isLoading && (
							<div className="flex-1 flex items-center justify-center p-8">
								<div className="flex items-center justify-center gap-2 text-[#4a5565]">
									<Loader2 className="size-4 animate-spin" />
									<p>Loading inquiry tickets...</p>
								</div>
							</div>
						)}
						{/* Error State */}
						{!isLoading && error && (
							<div className="flex-1 flex items-center justify-center p-8">
								<div className="text-center text-destructive">
									<p>{error}</p>
								</div>
							</div>
						)}
						{/* Scrollable table content */}
						{!isLoading && !error && (
							<div className="flex-1 overflow-auto min-h-0">
								<div
									className={pagination.totalPages > 0 ? "px-4 pb-4 pt-1" : ""}
								>
									<div
										className={
											pagination.totalPages > 0
												? "border rounded-md overflow-hidden"
												: "overflow-hidden"
										}
									>
										<Table>
											<TableHeader>
												<TableRow className="hover:bg-transparent">
													<TableHead className="w-48 h-8 text-xs font-medium">
														ID
													</TableHead>
													<TableHead className="w-72 h-8 text-xs font-medium">
														Name
													</TableHead>
													<TableHead className="min-w-96 h-8 text-xs font-medium">
														Subject
													</TableHead>
													<TableHead className="w-56 h-8 text-xs font-medium">
														Status
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{filteredTickets.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={4}
															className="text-center py-8 text-muted-foreground"
														>
															No inquiry tickets found
														</TableCell>
													</TableRow>
												) : (
													filteredTickets.map((ticket) => (
														<TableRow
															key={ticket.id}
															className="cursor-pointer hover:bg-muted/50 transition-colors h-17.5"
															onClick={() => setSelectedTicket(ticket.id)}
														>
															<TableCell className="w-48">
																<Badge
																	variant="outline"
																	className="font-mono text-xs px-2 py-1"
																>
																	{ticket.referenceNumber}
																</Badge>
															</TableCell>
															<TableCell className="w-72">
																<div className="flex items-center gap-3">
																	<div className="flex items-center gap-1 text-xs">
																		<MessageCircle className="h-3 w-3 text-muted-foreground" />
																		<span className="text-muted-foreground">
																			1
																		</span>
																	</div>
																	<span className="font-medium">
																		{ticket.citizenName}
																	</span>
																</div>
															</TableCell>
															<TableCell className="min-w-96">
																<div className="space-y-2">
																	<div className="font-medium text-sm leading-tight">
																		{ticket.subject}
																	</div>
																	<div className="flex items-center gap-1 text-xs text-muted-foreground">
																		<Tag className="h-3 w-3" />
																		{formatInquiryCategory(ticket.category)}
																	</div>
																</div>
															</TableCell>
															<TableCell className="w-56">
																<div className="space-y-2">
																	<InquiryStatusBadge status={ticket.status} />
																	<div className="text-xs text-muted-foreground">
																		{new Date(
																			ticket.createdAt,
																		).toLocaleDateString("en-US", {
																			month: "short",
																			day: "numeric",
																		})}
																	</div>
																</div>
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</div>
								</div>
							</div>
						)}{" "}
					</Card>
				</div>
			</div>

			{/* Detail Sheet */}
			<InquiryTicketSheet
				ticketId={selectedTicket}
				isOpen={!!selectedTicket}
				onClose={() => setSelectedTicket(null)}
			/>
		</>
	);
}
