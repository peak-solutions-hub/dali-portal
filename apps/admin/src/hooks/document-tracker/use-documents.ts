"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { orpc } from "@/lib/api.client";
import { useDocumentStore } from "@/stores/document-store";
import {
	toDocumentFilterEndDate,
	toDocumentFilterStartDate,
} from "@/utils/document-helpers";

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
			dateFrom: dateFrom ? toDocumentFilterStartDate(dateFrom) : undefined,
			dateTo: dateTo ? toDocumentFilterEndDate(dateTo) : undefined,
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
