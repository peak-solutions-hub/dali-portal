import { Skeleton } from "@repo/ui/components/skeleton";

export function SessionPaginationSkeleton() {
	return (
		<div className="sticky bottom-0 left-0 right-0 xl:sticky xl:top-38.5 xl:bottom-auto z-20 bg-white py-3 px-4 mb-0 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-t xl:border-t-0 xl:border-b border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] xl:shadow-sm">
			<div className="container mx-auto px-4 flex flex-col sm:flex-row gap-3 items-center sm:items-center justify-between w-full">
				<Skeleton className="h-5 w-48 mx-auto sm:mx-0" />
				<div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-9 w-24" />
				</div>
			</div>
		</div>
	);
}
