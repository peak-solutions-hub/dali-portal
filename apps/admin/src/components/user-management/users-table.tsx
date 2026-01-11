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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

	const [menuOpenUserId, setMenuOpenUserId] = useState<string | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpenUserId(null);
			}
		};
		if (menuOpenUserId) {
			document.addEventListener("click", onDocClick);
		}
		return () => document.removeEventListener("click", onDocClick);
	}, [menuOpenUserId]);

	const handleActionClick = (user: User) => {
		setSelectedUser(user);
		setMenuOpenUserId((prev) => (prev === user.id ? null : user.id));
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
							<TableCell className="px-6 py-5 text-right relative">
								<div className="inline-flex items-center justify-end relative">
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => handleActionClick(user)}
										className="rounded-md"
										aria-haspopup="menu"
										aria-expanded={menuOpenUserId === user.id}
									>
										<MoreHorizontal className="size-4" />
									</Button>
									{menuOpenUserId === user.id && (
										<div
											ref={menuRef}
											role="menu"
											className="absolute right-0 top-full mt-2 w-40 rounded-md border bg-white shadow-md z-50"
										>
											<button
												className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
												onClick={() => {
													setSelectedUser(user);
													setUpdateDialogOpen(true);
													setMenuOpenUserId(null);
												}}
											>
												<Pencil className="w-4 h-4 mr-2" />
												Edit
											</button>
											<button
												className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
												onClick={() => {
													setSelectedUser(user);
													setDeleteDialogOpen(true);
													setMenuOpenUserId(null);
												}}
											>
												<Trash2 className="w-4 h-4 mr-2 text-red-600" />
												Deactivate
											</button>
										</div>
									)}
								</div>
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
