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
import { Bell, MessageCircle, Search, Tag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { InquiryStatusBadge } from "@/components/inquiry-tickets/inquiry-status-badge";
import { InquiryTicketSheet } from "@/components/inquiry-tickets/inquiry-ticket-sheet";
import { api } from "@/lib/api.client";
import { formatInquiryCategory } from "@/utils/inquiry-helpers";
export default function InquiryTicketsPage() {
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [searchQuery, _setSearchQuery] = useState("");
	const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
	const [allTickets, setAllTickets] = useState<InquiryTicketResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch all tickets once on mount
	useEffect(() => {
		async function fetchTickets() {
			setIsLoading(true);
			setError(null);

			const [err, result] = await api.inquiries.getList({
				limit: 100,
				// Always fetch all tickets to get accurate counts
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

			setAllTickets(result || []);
			setIsLoading(false);
		}

		fetchTickets();
	}, []); // Only run once on mount

	// Calculate status counts from all loaded tickets
	const statusCounts = {
		all: allTickets.length,
		new: allTickets.filter((t) => t.status === "new").length,
		open: allTickets.filter((t) => t.status === "open").length,
		waiting_for_citizen: allTickets.filter(
			(t) => t.status === "waiting_for_citizen",
		).length,
		resolved: allTickets.filter((t) => t.status === "resolved").length,
		rejected: allTickets.filter((t) => t.status === "rejected").length,
	};

	// Filter tickets by status and search query
	const filteredTickets = allTickets.filter((ticket) => {
		const matchesStatus =
			selectedStatus === "all" || ticket.status === selectedStatus;
		const matchesSearch =
			searchQuery === "" ||
			ticket.referenceNumber
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			ticket.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesStatus && matchesSearch;
	});

	return (
		<>
			<div className="flex-1 flex flex-col h-full">
				{/* Sticky Status Tabs */}
				<div className="sticky top-0 z-10 p-6 pb-4 pt-0">
					<Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
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

				{/* Scrollable Content */}
				<div className="flex-1 overflow-auto p-6 pt-0 space-y-6">
					{/* Table Card */}
					<Card className="overflow-hidden">
						<div className="p-4">
							<div className="mb-4 flex items-center justify-between">
								<div className="text-sm text-muted-foreground">
									{filteredTickets.length} inquiry(ies) found{" "}
									<span className="text-xs">(Page 1 of 1)</span>
								</div>
							</div>

							<div className="border rounded-md overflow-hidden">
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
										{isLoading ? (
											<TableRow>
												<TableCell colSpan={4} className="text-center py-8">
													Loading inquiry tickets...
												</TableCell>
											</TableRow>
										) : error ? (
											<TableRow>
												<TableCell
													colSpan={4}
													className="text-center py-8 text-destructive"
												>
													{error}
												</TableCell>
											</TableRow>
										) : filteredTickets.length === 0 ? (
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
													className="cursor-pointer hover:bg-muted/50 transition-colors h-[70px]"
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
																<span className="text-muted-foreground">1</span>
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
																{new Date(ticket.createdAt).toLocaleDateString(
																	"en-US",
																	{
																		month: "short",
																		day: "numeric",
																	},
																)}
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
