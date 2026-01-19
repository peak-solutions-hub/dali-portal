import { Skeleton } from "@repo/ui/components/skeleton";

export function SessionPaginationSkeleton() {
	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
				<Skeleton className="h-5 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>
		</div>
	);
}
