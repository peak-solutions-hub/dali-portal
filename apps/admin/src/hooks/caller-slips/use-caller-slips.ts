"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { orpc } from "@/lib/api.client";
import { useCallerSlipStore } from "@/stores/caller-slip-store";

export function useCallerSlips() {
	const { search, statusFilter, dateFrom, dateTo, page, limit } =
		useCallerSlipStore();

	const input = useMemo(
		() => ({
			search: search || undefined,
			status: statusFilter === "all" ? undefined : statusFilter,
			dateFrom: dateFrom ?? undefined,
			dateTo: dateTo ?? undefined,
			page,
			limit,
		}),
		[search, statusFilter, dateFrom, dateTo, page, limit],
	);

	const queryOptions = orpc.callerSlips.getList.queryOptions({ input });

	return useQuery({
		...queryOptions,
		placeholderData: keepPreviousData,
	});
}
