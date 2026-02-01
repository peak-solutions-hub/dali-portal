"use client";

import {
	buildSessionQueryString,
	validateSessionSearchParams,
} from "@repo/shared";
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
		// Convert searchParams to object
		const paramsObj: Record<string, string> = {};
		searchParams.forEach((paramValue, key) => {
			paramsObj[key] = paramValue;
		});

		// Validate current params to avoid perpetuating invalid values
		const validationResult = validateSessionSearchParams(paramsObj);

		if (!validationResult.success) {
			// If validation fails, just use minimal valid params
			const queryString = buildSessionQueryString({
				view: "list",
				page: 1,
				sort: value,
			});
			router.push(`/sessions?${queryString}`);
			return;
		}

		// Build query with validated params and new sort
		const validatedParams = validationResult.data;
		const queryString = buildSessionQueryString({
			view: validatedParams.view,
			page: 1, // Reset to first page when sorting changes
			sort: value,
			types:
				validatedParams.types &&
				validatedParams.types != "all" &&
				validatedParams.types.length > 0
					? validatedParams.types.join(",")
					: undefined,
			statuses:
				validatedParams.statuses &&
				validatedParams.statuses != "all" &&
				validatedParams.statuses.length > 0
					? validatedParams.statuses.join(",")
					: undefined,
			dateFrom: validatedParams.dateFrom
				? validatedParams.dateFrom.toISOString().split("T")[0]
				: undefined,
			dateTo: validatedParams.dateTo
				? validatedParams.dateTo.toISOString().split("T")[0]
				: undefined,
			month: validatedParams.month,
			year: validatedParams.year,
		});
		router.push(`/sessions?${queryString}`);
	};

	return (
		<div className="flex items-center gap-2">
			<Select value={currentSort} onValueChange={handleSortChange}>
				<SelectTrigger className="h-8 w-full cursor-pointer border-[rgba(0,0,0,0.1)] bg-white sm:h-9 text-sm">
					<SelectValue />
				</SelectTrigger>
				<SelectContent
					side="bottom"
					align="start"
					sideOffset={4}
					position="popper"
					className="z-50"
				>
					<SelectItem value="desc" className="cursor-pointer text-sm">
						Latest
					</SelectItem>
					<SelectItem value="asc" className="cursor-pointer text-sm">
						Oldest
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
