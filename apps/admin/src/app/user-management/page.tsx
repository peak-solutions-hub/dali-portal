"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Filter, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { UsersTable } from "@/components/user-management";
import { InviteUserDialog } from "@/components/user-management/invite-user-dialog";

export default function UserManagementPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

	// Mock data - will be replaced with API calls
	const users = [
		{
			id: "1",
			fullName: "Che Cruz",
			email: "che@iloilo.gov.ph",
			role: "Administrative Office Clerk",
			status: "active" as const,
		},
		{
			id: "2",
			fullName: "Ruth Santos",
			email: "ruth@iloilo.gov.ph",
			role: "Administrative Office Clerk",
			status: "active" as const,
		},
		{
			id: "3",
			fullName: "Hon. Sheen Marie Mabilog",
			email: "councilor.mabilog@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "4",
			fullName: "Hon. Love Baronda",
			email: "vice.mayor@iloilo.gov.ph",
			role: "Vice Mayor",
			status: "active" as const,
		},
		{
			id: "5",
			fullName: "Hon. Rex Marcus Sarabia",
			email: "councilor.sarabia@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "6",
			fullName: "Joan Reyes",
			email: "joan@iloilo.gov.ph",
			role: "Information Systems Analyst",
			status: "active" as const,
		},
		{
			id: "7",
			fullName: "System Administrator",
			email: "admin@iloilo.gov.ph",
			role: "Administrator",
			status: "active" as const,
		},
		{
			id: "8",
			fullName: "Rem Garcia",
			email: "rem@iloilo.gov.ph",
			role: "Administrative Office Department Head",
			status: "active" as const,
		},
		{
			id: "9",
			fullName: "Carlos VM Staff",
			email: "vm.staff@iloilo.gov.ph",
			role: "Vice Mayor Office Staff",
			status: "active" as const,
		},
		{
			id: "10",
			fullName: "Hon. Nene Dela Llana",
			email: "councilor.delallana@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "11",
			fullName: "Hon. Romel Duron",
			email: "councilor.duron@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "12",
			fullName: "Maria Santos",
			email: "secretariat@iloilo.gov.ph",
			role: "Secretariat",
			status: "active" as const,
		},
		{
			id: "13",
			fullName: "Hon. Rudolph Jeffrey Ganzon",
			email: "councilor.ganzon@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "14",
			fullName: "Hon. Frances Grace Parcon-Torres",
			email: "councilor.torres@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "15",
			fullName: "Hon. Sedfrey Cabaluna",
			email: "councilor.cabaluna@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "16",
			fullName: "Hon. Miguel Trenas",
			email: "councilor.trenas@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "17",
			fullName: "Hon. Mandrie Malabor",
			email: "councilor.malabor@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "18",
			fullName: "Hon. Alan Zaldivar",
			email: "councilor.zaldivar@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "19",
			fullName: "Hon. Irene Ong",
			email: "liga.president@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "20",
			fullName: "Hon. Lyndon Acap",
			email: "councilor.acap@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "21",
			fullName: "Hon. Johnny Young",
			email: "councilor.young@iloilo.gov.ph",
			role: "City Councilor",
			status: "active" as const,
		},
		{
			id: "22",
			fullName: "Hon. Jelma Crystel Implica",
			email: "sk.president@iloilo.gov.ph",
			role: "City Councilor",
			status: "invited" as const,
		},
	];

	// Filter users based on search query and role
	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole = roleFilter === "all" || user.role === roleFilter;
		return matchesSearch && matchesRole;
	});

	// Get unique roles for filter dropdown
	const uniqueRoles = Array.from(new Set(users.map((user) => user.role)));

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
				>
					<UserPlus className="size-4" />
					Invite New User
				</Button>
			</div>

			{/* Filters Card */}
			<Card className="p-4 flex flex-col gap-6">
				<div className="flex items-center gap-4">
					{/* Search Input */}
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
						<Input
							placeholder="Search by name or email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 bg-[#f3f3f5] border-transparent"
						/>
					</div>

					{/* Role Filter */}
					<Select value={roleFilter} onValueChange={setRoleFilter}>
						<SelectTrigger className="w-64 bg-[#f3f3f5] border-transparent">
							<Filter className="size-4" />
							<SelectValue placeholder="All Roles" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Roles</SelectItem>
							{uniqueRoles.map((role) => (
								<SelectItem key={role} value={role}>
									{role}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Results Count */}
				<p className="text-sm text-[#4a5565]">
					Showing {filteredUsers.length} of {users.length} users
				</p>
			</Card>

			{/* Users Table */}
			<Card className="p-0 overflow-hidden">
				<UsersTable users={filteredUsers} />
			</Card>

			{/* Invite User Dialog */}
			<InviteUserDialog
				open={inviteDialogOpen}
				onOpenChange={setInviteDialogOpen}
			/>
		</div>
	);
}
