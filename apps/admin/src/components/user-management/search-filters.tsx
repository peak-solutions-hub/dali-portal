"use client";

import type { Role, UserStatus } from "@repo/shared";
import { formatRoleDisplay } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Separator } from "@repo/ui/components/separator";
import { Filter, Search, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	roleFilter: Role["name"] | "all";
	onRoleChange: (value: Role["name"] | "all") => void;
	statusFilter: UserStatus[];
	onStatusChange: (value: UserStatus[]) => void;
	roles: Role[];
	resultCount: number;
	totalCount: number;
	startItem: number;
	endItem: number;
	onInviteClick: () => void;
	isLoading?: boolean;
}

export function SearchFilters({
	searchQuery,
	onSearchChange,
	roleFilter,
	onRoleChange,
	statusFilter,
	onStatusChange,
	roles,
	resultCount,
	totalCount,
	startItem,
	endItem,
	onInviteClick,
	isLoading = false,
}: Props) {
	const [isOpen, setIsOpen] = useState(false);

	// Local state for pending filter selections
	const [pendingStatusFilter, setPendingStatusFilter] =
		useState<UserStatus[]>(statusFilter);
	const [pendingRoleFilter, setPendingRoleFilter] = useState<
		Role["name"] | "all"
	>(roleFilter);

	// Sync local state when popover opens
	useEffect(() => {
		if (isOpen) {
			setPendingStatusFilter(statusFilter);
			setPendingRoleFilter(roleFilter);
		}
	}, [isOpen]); // Only depend on isOpen to avoid stale state issues

	const hasActiveFilters = roleFilter !== "all" || statusFilter.length > 0;

	const handleApplyFilters = () => {
		onRoleChange(pendingRoleFilter);
		onStatusChange(pendingStatusFilter);
		setIsOpen(false);
	};

	const handleClearFilters = () => {
		setPendingRoleFilter("all");
		setPendingStatusFilter([]);
		setIsOpen(false);
	};

	const handleClearAllFilters = () => {
		onRoleChange("all");
		onStatusChange([]);
	};

	return (
		<Card className="p-4">
			<div className="flex items-center gap-3">
				{/* Search Bar - Shorter width */}
				<div className="relative w-80">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
					<Input
						placeholder="Search by name or email..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-10 bg-white border-[#d0d5dd] focus:border-[#a60202] focus:ring-[#a60202]"
					/>
				</div>

				{/* Filter Button with Popover */}
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="gap-2 border-[#d0d5dd] hover:bg-gray-50 relative cursor-pointer"
						>
							<Filter className="size-4" />
							Filter
							{hasActiveFilters && (
								<Badge
									variant="destructive"
									className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#a60202]"
								>
									{(roleFilter !== "all" ? 1 : 0) + statusFilter.length}
								</Badge>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80 p-0" align="start">
						<div className="p-4 space-y-4">
							{/* Status Filter */}
							<div className="space-y-3">
								<Label className="text-sm font-medium text-[#364153]">
									Status
								</Label>
								<div className="space-y-2">
									<label className="flex cursor-pointer items-center gap-2">
										<Checkbox
											checked={pendingStatusFilter.includes("active")}
											onCheckedChange={(checked) => {
												if (checked) {
													setPendingStatusFilter([
														...pendingStatusFilter,
														"active",
													]);
												} else {
													setPendingStatusFilter(
														pendingStatusFilter.filter((s) => s !== "active"),
													);
												}
											}}
										/>
										<span className="text-sm text-gray-700">Active</span>
									</label>
									<label className="flex cursor-pointer items-center gap-2">
										<Checkbox
											checked={pendingStatusFilter.includes("invited")}
											onCheckedChange={(checked) => {
												if (checked) {
													setPendingStatusFilter([
														...pendingStatusFilter,
														"invited",
													]);
												} else {
													setPendingStatusFilter(
														pendingStatusFilter.filter((s) => s !== "invited"),
													);
												}
											}}
										/>
										<span className="text-sm text-gray-700">Invited</span>
									</label>
									<label className="flex cursor-pointer items-center gap-2">
										<Checkbox
											checked={pendingStatusFilter.includes("deactivated")}
											onCheckedChange={(checked) => {
												if (checked) {
													setPendingStatusFilter([
														...pendingStatusFilter,
														"deactivated",
													]);
												} else {
													setPendingStatusFilter(
														pendingStatusFilter.filter(
															(s) => s !== "deactivated",
														),
													);
												}
											}}
										/>
										<span className="text-sm text-gray-700">Deactivated</span>
									</label>
								</div>
							</div>

							<Separator />

							{/* Role Filter */}
							<div className="space-y-3">
								<Label className="text-sm font-medium text-[#364153]">
									Role
								</Label>
								<Select
									value={pendingRoleFilter}
									onValueChange={(value) =>
										setPendingRoleFilter(value as Role["name"] | "all")
									}
								>
									<SelectTrigger className="w-full h-10 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer">
										<SelectValue placeholder="Select a role" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Roles</SelectItem>
										{roles.map((role: Role) => (
											<SelectItem key={role.id} value={role.name}>
												{formatRoleDisplay(role.name)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Footer with Clear and Apply buttons */}
						<div className="flex gap-2 px-4 pb-4 border-t pt-4">
							<Button
								variant="outline"
								onClick={handleClearFilters}
								className="flex-1"
								size="sm"
							>
								<X className="w-4 h-4 mr-2" />
								Clear
							</Button>
							<Button
								onClick={handleApplyFilters}
								className="flex-1 bg-[#a60202] hover:bg-[#8a0101]"
								size="sm"
							>
								Apply Filters
							</Button>
						</div>
					</PopoverContent>
				</Popover>

				{/* Clear All button - shows outside when filters are active */}
				{hasActiveFilters && (
					<Button
						variant="outline"
						size="sm"
						className="h-9 border-[#d0d5dd] hover:bg-gray-50 cursor-pointer"
						onClick={handleClearAllFilters}
					>
						Clear All
					</Button>
				)}

				{/* Spacer to push invite button to the right */}
				<div className="flex-1" />

				{/* Invite User Button */}
				<Button
					onClick={onInviteClick}
					className="bg-[#a60202] hover:bg-[#8a0101] text-white gap-2 cursor-pointer"
					disabled={isLoading}
				>
					<UserPlus className="size-4" />
					Invite New User
				</Button>
			</div>

			{/* Results Count */}
			<div>
				{resultCount === 0 &&
				(searchQuery || roleFilter !== "all" || statusFilter.length > 0) ? (
					<p className="text-sm text-[#4a5565]">
						No users found with the selected filters
					</p>
				) : (
					<p className="text-sm text-gray-700">
						Showing <span className="font-semibold">{startItem}</span>
						{endItem > startItem && (
							<>
								{" "}
								- <span className="font-semibold">{endItem}</span>
							</>
						)}{" "}
						of <span className="font-semibold">{totalCount}</span> users
					</p>
				)}
			</div>
		</Card>
	);
}
