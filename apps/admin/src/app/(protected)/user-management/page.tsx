"use client";

import type { Role, UserWithRole } from "@repo/shared";
import { USERS_ITEMS_PER_PAGE, UserStatus } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { useDebounce } from "@repo/ui/hooks/use-debounce";
import { usePagination } from "@repo/ui/hooks/use-pagination";
import { AlertTriangle, Loader2 } from "@repo/ui/lib/lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	InviteUserDialog,
	SearchFilters,
	UsersTable,
} from "@/components/user-management";
import { orpc } from "@/lib/api.client";

export default function UserManagementPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearch = useDebounce(searchQuery, 300);
	const [roleFilter, setRoleFilter] = useState<Role["name"] | "all">("all");
	const [statusFilter, setStatusFilter] = useState<UserStatus[]>([]);
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(USERS_ITEMS_PER_PAGE);

	const {
		data: usersData,
		isLoading: isUsersLoading,
		error: usersError,
		refetch: refetchUsers,
	} = useQuery(orpc.users.list.queryOptions({ input: {} }));

	const {
		data: rolesData,
		isLoading: isRolesLoading,
		error: rolesError,
		refetch: refetchRoles,
	} = useQuery(orpc.roles.list.queryOptions());

	const users = (usersData?.users as unknown as UserWithRole[]) || [];
	const roles = (rolesData?.roles as unknown as Role[]) || [];
	const isLoading = isUsersLoading || isRolesLoading;
	const error = usersError?.message || rolesError?.message || null;

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
			user.email.toLowerCase().includes(debouncedSearch.toLowerCase());
		const matchesRole = roleFilter === "all" || user.role.name === roleFilter;
		const matchesStatus =
			statusFilter.length === 0 ||
			statusFilter.includes(user.status as UserStatus);
		return matchesSearch && matchesRole && matchesStatus;
	});

	// Pagination calculations
	const totalUsers = filteredUsers.length;

	// Page number calculations via hook (supports totalItems + itemsPerPage)
	const {
		pageNumbers,
		startPage,
		endPage,
		showStartEllipsis,
		showEndEllipsis,
		totalPages: computedTotalPages,
		startIndex,
		endIndex,
		startItem,
		endItem,
	} = usePagination({
		currentPage,
		totalItems: totalUsers,
		itemsPerPage,
		maxVisiblePages: 5,
	});

	const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleRefresh = () => {
		refetchUsers();
		refetchRoles();
	};

	// Reset page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearch, roleFilter, statusFilter]);

	return (
		<div className="flex flex-col gap-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold text-[#101828]">
					User Management
				</h1>
				<p className="text-sm text-[#4a5565]">
					Manage system users and role assignments
				</p>
			</div>

			{/* Error State */}
			{error && (
				<Card className="p-4 border-red-200 bg-red-50">
					<div className="flex items-center gap-2 text-red-800">
						<AlertTriangle className="size-4" />
						<p>{error}</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => window.location.reload()}
							className="ml-auto text-red-600 border-red-200"
						>
							Retry
						</Button>
					</div>
				</Card>
			)}

			{/* Loading State */}
			{isLoading && (
				<Card className="p-8 text-center">
					<div className="flex items-center justify-center gap-2 text-[#4a5565]">
						<Loader2 className="size-4 animate-spin" />
						<p>Loading users...</p>
					</div>
				</Card>
			)}

			{/* Content */}
			{!isLoading && !error && (
				<div className="flex flex-col gap-3">
					<SearchFilters
						searchQuery={searchQuery}
						onSearchChange={(v) => setSearchQuery(v)}
						roleFilter={roleFilter}
						onRoleChange={(v) => setRoleFilter(v)}
						statusFilter={statusFilter}
						onStatusChange={(v) => setStatusFilter(v)}
						roles={roles}
						resultCount={filteredUsers.length}
						totalCount={users.length}
						startItem={startItem}
						endItem={endItem}
						onInviteClick={() => setInviteDialogOpen(true)}
						isLoading={isLoading}
					/>

					{paginatedUsers.length === 0 ? (
						<Card className="p-12 text-center">
							<div className="flex flex-col items-center gap-3 text-[#4a5565]">
								<AlertTriangle className="size-12 text-[#d0d5dd]" />
								<div>
									<h3 className="text-lg font-medium text-[#101828] mb-1">
										No users found
									</h3>
									<p className="text-sm">
										Try adjusting your search or filter criteria
									</p>
								</div>
							</div>
						</Card>
					) : (
						<Card className="p-0 overflow-hidden">
							<UsersTable
								users={paginatedUsers}
								roles={roles}
								onRefresh={handleRefresh}
								totalUsers={totalUsers}
								currentPage={currentPage}
								totalPages={computedTotalPages}
								onPageChange={handlePageChange}
								itemsPerPage={itemsPerPage}
								onItemsPerPageChange={(value) => {
									setItemsPerPage(value);
									setCurrentPage(1);
								}}
								pageNumbers={pageNumbers}
								startPage={startPage}
								endPage={endPage}
								showStartEllipsis={showStartEllipsis}
								showEndEllipsis={showEndEllipsis}
							/>
						</Card>
					)}
				</div>
			)}

			<InviteUserDialog
				open={inviteDialogOpen}
				onOpenChange={setInviteDialogOpen}
			/>
		</div>
	);
}
