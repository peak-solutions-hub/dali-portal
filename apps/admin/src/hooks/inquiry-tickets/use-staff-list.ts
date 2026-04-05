"use client";

import type { AssignableUserResponse, RoleType } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api.client";

export interface UseStaffListReturn {
	users: AssignableUserResponse[];
	isLoading: boolean;
	error: string | null;
}

export interface UseStaffListOptions {
	allowedRoles?: RoleType[];
}

/**
 * Fetches all active staff users for use in assignment dropdowns.
 * Results are cached by TanStack Query.
 */
export function useStaffList(
	options: UseStaffListOptions = {},
): UseStaffListReturn {
	const { data, isLoading, error } = useQuery({
		queryKey: ["staff-list", "active", options.allowedRoles ?? []],
		queryFn: async () => {
			const [err, result] = await api.users.listAssignable({
				roles: options.allowedRoles,
			});
			if (err) throw err;
			const users = result?.users ?? [];

			if (!options.allowedRoles || options.allowedRoles.length === 0) {
				return users;
			}

			return users.filter((user) => options.allowedRoles?.includes(user.role));
		},
		staleTime: 5 * 60 * 1000, // 5 minutes — staff list changes infrequently
	});

	return {
		users: data ?? [],
		isLoading,
		error: error ? "Failed to load staff list" : null,
	};
}
