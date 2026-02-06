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
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@repo/ui/components/pagination";
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
import { useEffect, useRef, useState } from "react";
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
	// Optional pagination metadata (can be provided by parent)
	pageNumbers: number[];
	startPage: number;
	endPage: number;
	showStartEllipsis: boolean;
	showEndEllipsis: boolean;
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
	pageNumbers,
	startPage,
	endPage,
	showStartEllipsis,
	showEndEllipsis,
}: UsersTableProps) {
	const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [activateDialogOpen, setActivateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const [menuOpenUserId, setMenuOpenUserId] = useState<string | null>(null);
	const [menuPosition, setMenuPosition] = useState<"bottom" | "top">("bottom");
	const menuRef = useRef<HTMLDivElement | null>(null);
	const buttonRef = useRef<HTMLButtonElement | null>(null);

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

	const handleActionClick = (user: UserWithRole, index: number) => {
		setSelectedUser(user);

		// Determine if we should show menu above or below
		// Show menu on top for last 2 rows to prevent cutoff
		if (index >= users.length - 2) {
			setMenuPosition("top");
		} else {
			setMenuPosition("bottom");
		}

		setMenuOpenUserId((prev) => (prev === user.id ? null : user.id));
	};

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
								<TableCell className="px-6 py-3 text-right relative">
									<div className="inline-flex items-center justify-end relative">
										<Button
											ref={buttonRef}
											variant="ghost"
											size="icon-sm"
											onClick={() => handleActionClick(user, index)}
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
												className={`absolute right-0 ${menuPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"} w-40 rounded-md border bg-white shadow-md z-100`}
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

												{user.status === "invited" && (
													<button
														className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 flex items-center"
														onClick={() => {
															setMenuOpenUserId(null);
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
														<Mail className="w-4 h-4 mr-2 text-blue-600" />
														Re-invite
													</button>
												)}

												{user.status === "deactivated" ? (
													<button
														className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-gray-50 flex items-center"
														onClick={() => {
															setSelectedUser(user);
															setActivateDialogOpen(true);
															setMenuOpenUserId(null);
														}}
													>
														<Pencil className="w-4 h-4 mr-2 text-green-600" />
														Reactivate
													</button>
												) : (
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
												)}
											</div>
										)}
									</div>
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
							</TableRow>
						))}
					</TableBody>
				</Table>

				{/* Pagination Footer */}
				<div className="border-t py-4 px-6">
					<div className="flex items-center justify-between">
						{/* Left side - Rows per page */}
						{/* <div className="flex items-center gap-2">
							<span className="text-sm text-gray-700">Rows per page:</span>
							<select
								value={itemsPerPage}
								onChange={(e) => {
									const newValue = Number(e.target.value);
									if (onItemsPerPageChange) {
										onItemsPerPageChange(newValue);
									}
								}}
								className="border border-[#d0d5dd] rounded-md px-2 py-1 text-sm bg-white focus:border-[#a60202] focus:ring-[#a60202] focus:outline-none"
							>
								<option value="5">5</option>
								<option value="10">10</option>
								<option value="20">20</option>
							</select>
						</div> */}

						{/* Right side - Pagination */}
						{totalPages > 1 && (
							<Pagination className="mx-0">
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() => onPageChange(Math.max(1, currentPage - 1))}
											className={
												currentPage === 1
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>

									{showStartEllipsis && (
										<>
											<PaginationItem>
												<PaginationLink
													onClick={() => onPageChange(1)}
													isActive={currentPage === 1}
													className="cursor-pointer"
												>
													1
												</PaginationLink>
											</PaginationItem>
											{startPage > 2 && (
												<PaginationItem>
													<PaginationEllipsis />
												</PaginationItem>
											)}
										</>
									)}

									{pageNumbers.map((number) => (
										<PaginationItem key={number}>
											<PaginationLink
												onClick={() => onPageChange(number)}
												isActive={currentPage === number}
												className="cursor-pointer"
											>
												{number}
											</PaginationLink>
										</PaginationItem>
									))}

									{showEndEllipsis && (
										<>
											{endPage < totalPages - 1 && (
												<PaginationItem>
													<PaginationEllipsis />
												</PaginationItem>
											)}
											<PaginationItem>
												<PaginationLink
													onClick={() => onPageChange(totalPages)}
													isActive={currentPage === totalPages}
													className="cursor-pointer"
												>
													{totalPages}
												</PaginationLink>
											</PaginationItem>
										</>
									)}

									<PaginationItem>
										<PaginationNext
											onClick={() =>
												onPageChange(Math.min(totalPages, currentPage + 1))
											}
											className={
												currentPage === totalPages
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
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
