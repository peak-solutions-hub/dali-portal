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
	const trimmedSearchQuery = searchQuery.trim();
	const isAssignedToMeStatus = status === "assigned_to_me";
	const apiStatus =
		status === "all" || isAssignedToMeStatus
			? undefined
			: (status as InquiryStatus);

	// Fetch paginated list from server so list stays consistent with counts/search.
	const {
		data: listData,
		isLoading,
		error: ticketsError,
	} = useQuery({
		queryKey: [
			"inquiry-tickets",
			"list",
			status,
			page,
			trimmedSearchQuery,
			onlyAssignedToCurrentUser,
			currentUserId,
		],
		queryFn: async () => {
			const [err, result] = await api.inquiries.getList({
				status: apiStatus,
				search: trimmedSearchQuery || undefined,
				assignedToMe:
					isAssignedToMeStatus || (onlyAssignedToCurrentUser && !!currentUserId)
						? true
						: undefined,
				limit: ITEMS_PER_PAGE,
				page,
			});
			if (err) throw err;
			return result;
		},
	});

	// Separate query for accurate counts (independent of ticket list).
	const { data: statusCountsData, isLoading: isLoadingCounts } = useQuery({
		queryKey: ["inquiry-tickets", "status-counts", trimmedSearchQuery],
		queryFn: async () => {
			const [err, result] = await api.inquiries.getStatusCounts({
				search: trimmedSearchQuery || undefined,
			});
			if (err) throw err;
			return result;
		},
	});

	const tickets = listData?.tickets ?? [];
	const pagination: InquiryTicketsPagination = listData?.pagination ?? {
		currentPage: page,
		totalPages: 1,
		totalItems: 0,
		itemsPerPage: ITEMS_PER_PAGE,
		hasNextPage: false,
		hasPreviousPage: false,
	};

	// Status/count badges are server-derived so they remain accurate even when
	// the ticket list query is partial or paginated.
	const counts = useMemo(() => {
		return {
			...(statusCountsData ?? {
				all: 0,
				new: 0,
				open: 0,
				waiting_for_citizen: 0,
				resolved: 0,
				rejected: 0,
				assigned_to_me: 0,
			}),
		};
	}, [statusCountsData]);

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
