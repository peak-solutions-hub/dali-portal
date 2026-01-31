"use client";

import type { Role, UserWithRole } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { AlertTriangle, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { UsersTable } from "@/components/user-management";
import { InviteUserDialog, SearchFilters } from "@/components/user-management/";
import { api } from "@/lib/api.client";

export default function UserManagementPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<Role["name"] | "all">("all");
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [users, setUsers] = useState<UserWithRole[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Fetch all users and roles once on mount
	const fetchData = async () => {
		try {
			setIsLoading(true);

			// Fetch all users (no search or pagination)
			const [usersError, usersResult] = await api.users.list({});

			if (usersError) {
				throw usersError;
			}

			if (usersResult?.users) {
				setUsers(usersResult.users as unknown as UserWithRole[]);
			}

			// Fetch roles
			const [rolesError, rolesResult] = await api.roles.list();

			if (rolesError) {
				throw rolesError;
			}

			if (rolesResult?.roles) {
				setRoles(rolesResult.roles as unknown as Role[]);
			}

			setError(null);
		} catch (e) {
			console.error("Fetch error:", e);
			setError(
				`Failed to load data: ${e instanceof Error ? e.message : String(e)}`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole = roleFilter === "all" || user.role.name === roleFilter;
		return matchesSearch && matchesRole;
	});

	// Pagination calculations
	const totalUsers = filteredUsers.length;
	const totalPages = Math.ceil(totalUsers / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleRefresh = () => {
		// Refetch data
		fetchData();
	};

	// Reset page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, roleFilter]);

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold text-[#101828]">
						User Management
					</h1>
					<p className="text-sm text-[#4a5565]">
						Manage system users and role assignments
					</p>
				</div>
				<Button
					onClick={() => setInviteDialogOpen(true)}
					className="bg-[#a60202] hover:bg-[#8a0101] text-white gap-2"
					disabled={isLoading}
				>
					<UserPlus className="size-4" />
					Invite New User
				</Button>
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
				<>
					<SearchFilters
						searchQuery={searchQuery}
						onSearchChange={(v) => setSearchQuery(v)}
						roleFilter={roleFilter}
						onRoleChange={(v) => setRoleFilter(v)}
						roles={roles}
						resultCount={filteredUsers.length}
						totalCount={users.length}
					/>

					{paginatedUsers.length === 0 ? (
						<Card className="p-8 text-center">
							<div className="flex flex-col items-center gap-2 text-[#4a5565]">
								<p className="text-lg font-medium">No users found</p>
								<p className="text-sm">
									Try adjusting your search or filter criteria
								</p>
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
								totalPages={totalPages}
								onPageChange={handlePageChange}
								itemsPerPage={itemsPerPage}
							/>
						</Card>
					)}
				</>
			)}

			<InviteUserDialog
				open={inviteDialogOpen}
				onOpenChange={setInviteDialogOpen}
			/>
		</div>
	);
}
