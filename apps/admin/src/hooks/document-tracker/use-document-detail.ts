"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/api.client";

export function useDocumentDetail(id: string) {
	const queryOptions = orpc.documents.getById.queryOptions({
		input: { id },
	});

	return useQuery({
		...queryOptions,
		enabled: Boolean(id),
	});
}
