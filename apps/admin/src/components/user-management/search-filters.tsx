"use client";

import type { Role } from "@repo/shared";
import { formatRoleDisplay } from "@repo/shared";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Filter, Search } from "lucide-react";

interface Props {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	roleFilter: Role["name"] | "all";
	onRoleChange: (value: Role["name"] | "all") => void;
	roles: Role[];
	resultCount: number;
	totalCount: number;
}

export function SearchFilters({
	searchQuery,
	onSearchChange,
	roleFilter,
	onRoleChange,
	roles,
	resultCount,
	totalCount,
}: Props) {
	return (
		<Card className="p-4 flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
					<Input
						placeholder="Search by name or email..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-10 bg-white border-[#d0d5dd] focus:border-[#a60202] focus:ring-[#a60202]"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Select value={roleFilter} onValueChange={onRoleChange}>
						<SelectTrigger className="w-64 bg-white border-[#d0d5dd] focus:border-[#a60202] focus:ring-[#a60202]">
							<Filter className="size-4" />
							<SelectValue placeholder="All Roles" />
						</SelectTrigger>
						<SelectContent
							position="popper"
							side="bottom"
							align="start"
							sideOffset={4}
						>
							<SelectItem
								value="all"
								className="hover:bg-gray-100 cursor-pointer"
							>
								All Roles
							</SelectItem>
							{roles.map((role: Role) => (
								<SelectItem
									key={role.name}
									value={role.name}
									className="hover:bg-gray-100 cursor-pointer"
								>
									{formatRoleDisplay(role.name)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>{" "}
			</div>

			{resultCount === 0 && (searchQuery || roleFilter !== "all") ? (
				<p className="text-sm text-[#4a5565]">
					There are no users with this filter
				</p>
			) : (
				<p className="text-sm text-[#4a5565]">
					Showing {resultCount} of {totalCount} users
				</p>
			)}
		</Card>
	);
}
