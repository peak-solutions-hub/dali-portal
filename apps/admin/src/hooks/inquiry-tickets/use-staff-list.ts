"use client";

import type { UserWithRole } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api.client";

export interface UseStaffListReturn {
	users: UserWithRole[];
	isLoading: boolean;
	error: string | null;
}

/**
 * Fetches all active staff users for use in assignment dropdowns.
 * Results are cached by TanStack Query.
 */
export function useStaffList(): UseStaffListReturn {
	const { data, isLoading, error } = useQuery({
		queryKey: ["staff-list", "active"],
		queryFn: async () => {
			const [err, result] = await api.users.list({ status: "active" });
			if (err) throw err;
			return (result?.users ?? []).map((user) => ({
				...user,
				createdAt: new Date(user.createdAt),
				role: { ...user.role, createdAt: new Date(user.role.createdAt) },
			}));
		},
		staleTime: 5 * 60 * 1000, // 5 minutes — staff list changes infrequently
	});

	return {
		users: data ?? [],
		isLoading,
		error: error ? "Failed to load staff list" : null,
	};
}
