"use client";

import type { Role, UserWithRole } from "@repo/shared";
import {
	formatRoleDisplay,
	getRoleBadgeStyles,
	getStatusBadgeStyles,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { PaginationControl } from "@repo/ui/components/pagination-control";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import {
	Mail,
	MoreHorizontal,
	Pencil,
	Trash2,
} from "@repo/ui/lib/lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { ActivateUserDialog, DeactivateUserDialog, UpdateUserDialog } from ".";

interface UsersTableProps {
	users: UserWithRole[];
	roles: Role[];
	onRefresh?: () => void;
	totalUsers: number;
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	itemsPerPage: number;
	onItemsPerPageChange?: (value: number) => void;
}

export function UsersTable({
	users,
	roles,
	onRefresh,
	totalUsers,
	currentPage,
	totalPages,
	onPageChange,
	itemsPerPage,
	onItemsPerPageChange,
}: UsersTableProps) {
	const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [activateDialogOpen, setActivateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	return (
		<>
			<div>
				<Table>
					<TableHeader className="bg-[#f9fafb]">
						<TableRow className="border-b border-[rgba(0,0,0,0.1)]">
							<TableHead className="px-6 py-3 text-[#364153] font-medium text-sm min-w-64">
								User
							</TableHead>
							<TableHead className="px-6 py-3 text-[#364153] font-medium text-sm w-48">
								Role
							</TableHead>
							<TableHead className="px-6 py-3 text-[#364153] font-medium text-sm w-40">
								Status
							</TableHead>
							<TableHead className="px-6 py-3 text-[#364153] font-medium text-sm text-right w-32">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user, index) => (
							<TableRow
								key={user.id}
								className={`border-b border-[#e5e7eb] hover:bg-gray-50/50 ${index % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
							>
								<TableCell className="px-6 py-3">
									<div className="flex flex-col">
										<span className="text-sm font-medium text-[#101828]">
											{user.fullName}
										</span>
										<span className="text-sm text-[#6b7280]">{user.email}</span>
									</div>
								</TableCell>
								<TableCell className="px-6 py-3">
									<Badge
										className={`text-xs px-2 py-0.5 rounded-md ${getRoleBadgeStyles()}`}
									>
										{formatRoleDisplay(user.role.name)}
									</Badge>
								</TableCell>
								<TableCell className="px-6 py-3">
									<Badge
										variant="outline"
										className={`text-xs px-2 py-0.5 rounded-md border ${getStatusBadgeStyles(user.status)}`}
									>
										{user.status === "active"
											? "Active"
											: user.status === "invited"
												? "Invited"
												: user.status === "deactivated"
													? "Deactivated"
													: "Inactive"}
									</Badge>
								</TableCell>
								<TableCell className="px-6 py-3 text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												className="rounded-md"
											>
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-40">
											<DropdownMenuItem
												onClick={() => {
													setSelectedUser(user);
													setTimeout(() => setUpdateDialogOpen(true), 0);
												}}
											>
												<Pencil className="w-4 h-4 mr-2" />
												Edit
											</DropdownMenuItem>
											{user.status === "invited" && (
												<DropdownMenuItem
													className="text-blue-600 focus:text-blue-600"
													onClick={() => {
														const promise = api.users.invite({
															email: user.email,
															fullName: user.fullName,
															roleId: user.role.id,
														});

														toast.promise(promise, {
															loading: "Sending invitation...",
															success: "Invitation email sent successfully",
															error: (err) =>
																`Failed to send invitation: ${err.message}`,
														});
													}}
												>
													<Mail className="w-4 h-4 mr-2" />
													Re-invite
												</DropdownMenuItem>
											)}
											{user.status === "deactivated" ? (
												<DropdownMenuItem
													className="text-green-600 focus:text-green-600"
													onClick={() => {
														setSelectedUser(user);
														setTimeout(() => setActivateDialogOpen(true), 0);
													}}
												>
													<Pencil className="w-4 h-4 mr-2" />
													Reactivate
												</DropdownMenuItem>
											) : (
												<DropdownMenuItem
													className="text-red-600 focus:text-red-600"
													onClick={() => {
														setSelectedUser(user);
														setTimeout(() => setDeleteDialogOpen(true), 0);
													}}
												>
													<Trash2 className="w-4 h-4 mr-2" />
													Deactivate
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}

						{Array.from({
							length: Math.max(0, itemsPerPage - users.length),
						}).map((_, i) => (
							<TableRow
								key={`empty-${i}`}
								className={`border-b border-[#e5e7eb] ${(users.length + i) % 2 === 1 ? "bg-gray-50/30" : "bg-white"}`}
							>
								<TableCell className="px-6 py-5">
									<div className="h-6" />
								</TableCell>
								<TableCell className="px-6 py-5">
									<div className="h-6" />
								</TableCell>
								<TableCell className="px-6 py-5">
									<div className="h-6" />
								</TableCell>
								<TableCell className="px-6 py-5">
									<div className="h-6" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				{/* Pagination Footer */}
				<div className="border-t py-4 px-6">
					<div className="flex items-center justify-between">
						{totalPages > 1 && (
							<PaginationControl
								totalItems={totalUsers}
								itemsPerPage={itemsPerPage}
								currentPage={currentPage}
								onPageChange={onPageChange}
								className="mx-0"
							/>
						)}
					</div>
				</div>
			</div>

			{/* Update User Dialog */}
			{selectedUser && (
				<UpdateUserDialog
					open={updateDialogOpen}
					onOpenChange={setUpdateDialogOpen}
					user={selectedUser}
					roles={roles}
					onRefresh={onRefresh}
				/>
			)}

			{/* Delete User Dialog */}
			{selectedUser && (
				<DeactivateUserDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					user={selectedUser}
					onRefresh={onRefresh}
				/>
			)}

			{/* Activate User Dialog */}
			{selectedUser && (
				<ActivateUserDialog
					open={activateDialogOpen}
					onOpenChange={setActivateDialogOpen}
					user={selectedUser}
					onRefresh={onRefresh}
				/>
			)}
		</>
	);
}
