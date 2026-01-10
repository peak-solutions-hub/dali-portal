"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { DeleteUserDialog } from "./delete-user-dialog";
import { UpdateUserDialog } from "./update-user-dialog";

interface User {
	id: string;
	fullName: string;
	email: string;
	role: string;
	status: "active" | "invited";
}

interface UsersTableProps {
	users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const handleActionClick = (user: User) => {
		setSelectedUser(user);
		// For now, we'll open the update dialog
		// In a real implementation, this would show a dropdown menu
		setUpdateDialogOpen(true);
	};

	const getRoleBadgeStyles = (role: string) => {
		return "bg-[rgba(166,2,2,0.05)] border-[rgba(166,2,2,0.2)] text-[#a60202]";
	};

	const getStatusBadgeStyles = (status: string) => {
		if (status === "active") {
			return "bg-[#dcfce7] border-[#b9f8cf] text-[#016630]";
		}
		return "bg-[#dbeafe] border-[#bedbff] text-[#193cb8]";
	};

	return (
		<>
			<Table>
				<TableHeader className="bg-[#f9fafb]">
					<TableRow className="border-b border-[rgba(0,0,0,0.1)]">
						<TableHead className="px-6 py-4 text-[#364153] font-medium text-sm">
							Full Name
						</TableHead>
						<TableHead className="px-6 py-4 text-[#364153] font-medium text-sm">
							Email Address
						</TableHead>
						<TableHead className="px-6 py-4 text-[#364153] font-medium text-sm">
							Role
						</TableHead>
						<TableHead className="px-6 py-4 text-[#364153] font-medium text-sm">
							Status
						</TableHead>
						<TableHead className="px-6 py-4 text-[#364153] font-medium text-sm text-right">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow
							key={user.id}
							className="border-b border-[#e5e7eb] hover:bg-transparent"
						>
							<TableCell className="px-6 py-5">
								<div className="text-base font-medium text-[#101828]">
									{user.fullName}
								</div>
							</TableCell>
							<TableCell className="px-6 py-5">
								<div className="text-base text-[#4a5565]">{user.email}</div>
							</TableCell>
							<TableCell className="px-6 py-5">
								<Badge
									className={`text-xs px-2 py-0.5 rounded-md ${getRoleBadgeStyles(user.role)}`}
								>
									{user.role}
								</Badge>
							</TableCell>
							<TableCell className="px-6 py-5">
								<Badge
									className={`text-xs px-2 py-0.5 rounded-md ${getStatusBadgeStyles(user.status)}`}
								>
									{user.status === "active" ? "Active" : "Invited"}
								</Badge>
							</TableCell>
							<TableCell className="px-6 py-5 text-right">
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => handleActionClick(user)}
									className="rounded-md"
								>
									<MoreVertical className="size-4" />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* Update User Dialog */}
			{selectedUser && (
				<UpdateUserDialog
					open={updateDialogOpen}
					onOpenChange={setUpdateDialogOpen}
					user={selectedUser}
				/>
			)}

			{/* Delete User Dialog */}
			{selectedUser && (
				<DeleteUserDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					user={selectedUser}
				/>
			)}
		</>
	);
}
