"use client";

import type { RoleType, UserWithRole } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api.client";

export interface UseStaffListReturn {
	users: UserWithRole[];
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
			const [err, result] = await api.users.list({ status: "active" });
			if (err) throw err;
			const users = (result?.users ?? []).map((user) => ({
				...user,
				createdAt: new Date(user.createdAt),
				role: { ...user.role, createdAt: new Date(user.role.createdAt) },
			}));

			if (!options.allowedRoles || options.allowedRoles.length === 0) {
				return users;
			}

			return users.filter((user) =>
				options.allowedRoles?.includes(user.role.name),
			);
		},
		staleTime: 5 * 60 * 1000, // 5 minutes — staff list changes infrequently
	});

	return {
		users: data ?? [],
		isLoading,
		error: error ? "Failed to load staff list" : null,
	};
}
