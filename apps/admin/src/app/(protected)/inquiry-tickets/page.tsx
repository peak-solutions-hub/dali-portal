"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { InquiryStatusBadge } from "@repo/ui/components/inquiry-status-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { Loader2, MessageCircle, Tag } from "lucide-react";
import { useState } from "react";
import { InquiryTicketSheet } from "@/components/inquiry-tickets/inquiry-ticket-sheet";
import { PaginationControls } from "@/components/inquiry-tickets/pagination-controls";
import { useInquiryTickets } from "@/hooks/inquiry-tickets/use-inquiry-tickets";
import { formatInquiryCategory } from "@/utils/inquiry-helpers";

export default function InquiryTicketsPage() {
	const [selectedStatus, setSelectedStatus] = useState<string>("new");
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
	const [searchQuery] = useState("");

	const {
		tickets,
		pagination,
		counts,
		isLoading,
		isLoadingCounts,
		error,
		handleTicketUpdate,
	} = useInquiryTickets({
		status: selectedStatus,
		page: currentPage,
		searchQuery,
	});

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
							<TabsTrigger value="all" disabled={isLoadingCounts}>
								All ({isLoadingCounts ? "..." : counts.all})
							</TabsTrigger>
							<TabsTrigger value="new" disabled={isLoadingCounts}>
								New ({isLoadingCounts ? "..." : counts.new})
							</TabsTrigger>
							<TabsTrigger value="open" disabled={isLoadingCounts}>
								Open ({isLoadingCounts ? "..." : counts.open})
							</TabsTrigger>
							<TabsTrigger
								value="waiting_for_citizen"
								disabled={isLoadingCounts}
							>
								Waiting ({isLoadingCounts ? "..." : counts.waiting_for_citizen})
							</TabsTrigger>
							<TabsTrigger value="resolved" disabled={isLoadingCounts}>
								Resolved ({isLoadingCounts ? "..." : counts.resolved})
							</TabsTrigger>
							<TabsTrigger value="rejected" disabled={isLoadingCounts}>
								Rejected ({isLoadingCounts ? "..." : counts.rejected})
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* Table Card with internal scroll */}
				<div className="p-6 pt-0 flex-1 flex flex-col min-h-0">
					<Card className="flex-1 flex flex-col overflow-hidden min-h-0 p-0">
						{/* Pagination at top */}
						{pagination.totalPages > 1 && (
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
									className={pagination.totalPages > 1 ? "px-4 pb-4 pt-1" : ""}
								>
									<div
										className={
											pagination.totalPages > 1
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
												{tickets.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={4}
															className="text-center py-8 text-muted-foreground"
														>
															No inquiry tickets found
														</TableCell>
													</TableRow>
												) : (
													tickets.map((ticket) => (
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
																	<span
																		className="font-medium truncate max-w-45"
																		title={ticket.citizenName}
																	>
																		{ticket.citizenName}
																	</span>
																</div>
															</TableCell>
															<TableCell className="min-w-96">
																<div className="space-y-2">
																	<div
																		className="font-medium text-sm leading-tight line-clamp-2 max-w-96"
																		title={ticket.subject}
																	>
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
						)}
					</Card>
				</div>
			</div>

			{/* Detail Sheet */}
			<InquiryTicketSheet
				ticketId={selectedTicket}
				isOpen={!!selectedTicket}
				onClose={() => setSelectedTicket(null)}
				onStatusUpdate={handleTicketUpdate}
			/>
		</>
	);
}
