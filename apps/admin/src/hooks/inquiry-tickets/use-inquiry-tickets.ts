"use client";

import type { InquiryStatus, InquiryTicketResponse } from "@repo/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api.client";

const ITEMS_PER_PAGE = 20;

export interface InquiryTicketsPagination {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface UseInquiryTicketsOptions {
	status: string;
	page: number;
	searchQuery?: string;
	currentUserId?: string;
	onlyAssignedToCurrentUser?: boolean;
}

export interface UseInquiryTicketsReturn {
	tickets: InquiryTicketResponse[];
	pagination: InquiryTicketsPagination;
	counts: {
		all: number;
		new: number;
		open: number;
		waiting_for_citizen: number;
		resolved: number;
		rejected: number;
		assigned_to_me: number;
	};
	isLoading: boolean;
	isLoadingCounts: boolean;
	error: string | null;
	handleTicketUpdate: () => Promise<void>;
}

export function useInquiryTickets({
	status,
	page,
	searchQuery = "",
	currentUserId,
	onlyAssignedToCurrentUser = false,
}: UseInquiryTicketsOptions): UseInquiryTicketsReturn {
	const queryClient = useQueryClient();

	// Single fetch: all tickets at once — no status filter so tab switches
	// are instant (client-side filter only, no new network request).
	const {
		data: allTicketsData,
		isLoading,
		error: ticketsError,
	} = useQuery({
		queryKey: ["inquiry-tickets", "all"],
		queryFn: async () => {
			const [err, result] = await api.inquiries.getList({ limit: 100 });
			if (err) throw err;
			return result?.tickets ?? [];
		},
	});

	// Separate query for accurate counts (independent of ticket list).
	const { data: statusCountsData, isLoading: isLoadingCounts } = useQuery({
		queryKey: ["inquiry-tickets", "status-counts"],
		queryFn: async () => {
			const [err, result] = await api.inquiries.getStatusCounts();
			if (err) throw err;
			return result;
		},
	});

	const allTickets = allTicketsData ?? [];

	const roleScopedTickets = useMemo(() => {
		if (!onlyAssignedToCurrentUser) return allTickets;
		if (!currentUserId) return [];
		return allTickets.filter((ticket) => ticket.assignedTo === currentUserId);
	}, [allTickets, onlyAssignedToCurrentUser, currentUserId]);

	// Tickets matching the search query only (no status filter) — used to
	// recompute tab counts when a search is active.
	const searchFilteredTickets = useMemo(() => {
		if (!searchQuery) return roleScopedTickets;
		const q = searchQuery.toLowerCase();
		return roleScopedTickets.filter(
			(ticket) =>
				ticket.referenceNumber.toLowerCase().includes(q) ||
				(ticket.citizenFirstName &&
					ticket.citizenFirstName.toLowerCase().includes(q)) ||
				(ticket.citizenLastName &&
					ticket.citizenLastName.toLowerCase().includes(q)) ||
				ticket.subject.toLowerCase().includes(q),
		);
	}, [roleScopedTickets, searchQuery]);

	// Client-side filter by status and search query.
	const filteredTickets = useMemo(() => {
		const matchingTickets = roleScopedTickets.filter((ticket) => {
			const matchesStatus =
				status === "all" ||
				(status === "assigned_to_me"
					? currentUserId != null && ticket.assignedTo === currentUserId
					: ticket.status === (status as InquiryStatus));

			const matchesSearch =
				searchQuery === "" ||
				ticket.referenceNumber
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				(ticket.citizenFirstName &&
					ticket.citizenFirstName
						.toLowerCase()
						.includes(searchQuery.toLowerCase())) ||
				(ticket.citizenLastName &&
					ticket.citizenLastName
						.toLowerCase()
						.includes(searchQuery.toLowerCase())) ||
				ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesStatus && matchesSearch;
		});

		if (status !== "assigned_to_me") {
			return matchingTickets;
		}

		const statusPriority: Partial<Record<InquiryStatus, number>> = {
			new: 0,
			open: 1,
			waiting_for_citizen: 1,
			resolved: 2,
			rejected: 2,
		};

		return [...matchingTickets].sort((a, b) => {
			const aPriority = statusPriority[a.status] ?? 1;
			const bPriority = statusPriority[b.status] ?? 1;
			return aPriority - bPriority;
		});
	}, [roleScopedTickets, status, searchQuery, currentUserId]);

	// Client-side pagination over the filtered set.
	const totalItems = filteredTickets.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * ITEMS_PER_PAGE;
	const tickets = filteredTickets.slice(start, start + ITEMS_PER_PAGE);

	const pagination: InquiryTicketsPagination = {
		currentPage: safePage,
		totalPages,
		totalItems,
		itemsPerPage: ITEMS_PER_PAGE,
		hasNextPage: safePage < totalPages,
		hasPreviousPage: safePage > 1,
	};

	const assignedToMeCount = currentUserId
		? searchFilteredTickets.filter((t) => t.assignedTo === currentUserId).length
		: 0;

	// When a search is active, derive counts from the search-filtered pool so
	// the tab numbers reflect what the user is actually looking at.
	const counts = useMemo(() => {
		if (onlyAssignedToCurrentUser) {
			return {
				all: searchFilteredTickets.length,
				new: searchFilteredTickets.filter((t) => t.status === "new").length,
				open: searchFilteredTickets.filter((t) => t.status === "open").length,
				waiting_for_citizen: searchFilteredTickets.filter(
					(t) => t.status === "waiting_for_citizen",
				).length,
				resolved: searchFilteredTickets.filter((t) => t.status === "resolved")
					.length,
				rejected: searchFilteredTickets.filter((t) => t.status === "rejected")
					.length,
				assigned_to_me: searchFilteredTickets.length,
			};
		}

		if (!searchQuery) {
			return {
				...(statusCountsData ?? {
					all: 0,
					new: 0,
					open: 0,
					waiting_for_citizen: 0,
					resolved: 0,
					rejected: 0,
				}),
				assigned_to_me: assignedToMeCount,
			};
		}

		return {
			all: searchFilteredTickets.length,
			new: searchFilteredTickets.filter((t) => t.status === "new").length,
			open: searchFilteredTickets.filter((t) => t.status === "open").length,
			waiting_for_citizen: searchFilteredTickets.filter(
				(t) => t.status === "waiting_for_citizen",
			).length,
			resolved: searchFilteredTickets.filter((t) => t.status === "resolved")
				.length,
			rejected: searchFilteredTickets.filter((t) => t.status === "rejected")
				.length,
			assigned_to_me: assignedToMeCount,
		};
	}, [
		onlyAssignedToCurrentUser,
		searchQuery,
		statusCountsData,
		searchFilteredTickets,
		assignedToMeCount,
	]);

	const error = ticketsError
		? ticketsError.message || "Failed to fetch inquiry tickets"
		: null;

	const handleTicketUpdate = async () => {
		await queryClient.invalidateQueries({ queryKey: ["inquiry-tickets"] });
	};

	return {
		tickets,
		pagination,
		counts,
		isLoading,
		isLoadingCounts,
		error,
		handleTicketUpdate,
	};
}
