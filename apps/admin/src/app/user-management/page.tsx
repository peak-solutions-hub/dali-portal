"use client";

import { isDefinedError } from "@orpc/client";
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

	// Fetch users and roles from backend
	useEffect(() => {
		async function fetchData() {
			try {
				setIsLoading(true);

				// Fetch users
				const usersResult = await api.users.list({
					limit: 100,
					search: searchQuery || undefined,
					roleType:
						roleFilter !== "all" ? (roleFilter as Role["name"]) : undefined,
				});

				if (usersResult.users) {
					setUsers(usersResult.users as unknown as UserWithRole[]);
				}

				// Fetch roles
				const rolesResult = await api.roles.list();

				if (rolesResult.roles) {
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
		}

		fetchData();
	}, [searchQuery, roleFilter]);

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole = roleFilter === "all" || user.role.name === roleFilter;
		return matchesSearch && matchesRole;
	});

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

					<Card className="p-0 overflow-hidden">
						<UsersTable users={filteredUsers} roles={roles} />
					</Card>
				</>
			)}

			<InviteUserDialog
				open={inviteDialogOpen}
				onOpenChange={setInviteDialogOpen}
			/>
		</div>
	);
}
