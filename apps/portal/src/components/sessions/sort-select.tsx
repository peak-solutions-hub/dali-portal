"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useRouter, useSearchParams } from "next/navigation";

interface SortSelectProps {
	currentSort: "asc" | "desc";
}

export function SortSelect({ currentSort }: SortSelectProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleSortChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("sort", value);
		params.set("page", "1"); // Reset to first page when sorting changes
		router.push(`/sessions?${params.toString()}`);
	};

	return (
		<div className="flex items-center gap-2">
			<Select value={currentSort} onValueChange={handleSortChange}>
				<SelectTrigger className="h-8 w-full cursor-pointer border-[rgba(0,0,0,0.1)] bg-white text-xs sm:h-9 sm:text-sm">
					<SelectValue />
				</SelectTrigger>
				<SelectContent
					side="bottom"
					align="start"
					sideOffset={4}
					position="popper"
					className="z-50"
				>
					<SelectItem
						value="desc"
						className="cursor-pointer text-xs sm:text-sm"
					>
						Latest
					</SelectItem>
					<SelectItem value="asc" className="cursor-pointer text-xs sm:text-sm">
						Oldest
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
