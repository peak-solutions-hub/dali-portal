"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { orpc } from "@/lib/api.client";
import { useDocumentStore } from "@/stores/document-store";

export function useDocuments() {
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
	} = useDocumentStore();

	const input = useMemo(
		() => ({
			tab: activeTab,
			search: search || undefined,
			status: statusFilter === "all" ? undefined : statusFilter,
			type: typeFilter === "all" ? undefined : typeFilter,
			dateFrom: dateFrom
				? new Date(`${dateFrom}T00:00:00.000+08:00`)
				: undefined,
			dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999+08:00`) : undefined,
			page,
			limit,
			sortBy,
			sortOrder,
		}),
		[
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
		],
	);

	const queryOptions = orpc.documents.getList.queryOptions({ input });

	return useQuery({
		...queryOptions,
		placeholderData: keepPreviousData,
	});
}
