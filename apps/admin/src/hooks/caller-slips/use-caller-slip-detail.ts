"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/api.client";

export function useCallerSlipDetail(id: string) {
	const queryOptions = orpc.callerSlips.getById.queryOptions({
		input: { id },
	});

	return useQuery({
		...queryOptions,
		enabled: Boolean(id),
	});
}
