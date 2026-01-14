import { Skeleton } from "@repo/ui/components/skeleton";
import {
	SessionListViewSkeleton,
	SessionPaginationSkeleton,
} from "@/components/sessions";

export default function LoadingPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-6 py-8 max-w-7xl">
				{/* Page Header Skeleton */}
				<div className="mb-6">
					<Skeleton className="h-9 w-80 mb-2" />
					<Skeleton className="h-5 w-96" />
				</div>

				{/* View Toggle, Filter, and Sort Skeleton */}
				<div className="mb-4 sm:mb-6">
					{/* Mobile Filters */}
					<div className="xl:hidden sticky top-0 z-30 bg-gray-50 pb-4">
						<div className="flex flex-col gap-4">
							<div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
								<Skeleton className="h-9 w-full sm:w-40" />
								<div className="flex w-full items-center gap-2 sm:w-auto">
									<Skeleton className="h-9 flex-1 sm:flex-none sm:w-28" />
									<Skeleton className="h-9 flex-1 sm:flex-none sm:w-20" />
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="h-9 w-24" />
							</div>
						</div>
					</div>

					{/* Desktop Filters and Pagination Group */}
					<div className="hidden xl:block">
						<div className="sticky top-4 z-30 bg-gray-50 pb-4">
							<div className="flex flex-col gap-4">
								<div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
									<Skeleton className="h-9 w-40" />
									<div className="flex items-center gap-2">
										<Skeleton className="h-9 w-28" />
										<Skeleton className="h-9 w-20" />
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className="h-9 w-24" />
								</div>
								<SessionPaginationSkeleton />
							</div>
						</div>
					</div>
				</div>

				{/* Mobile Bottom Pagination */}
				<div className="xl:hidden mb-4">
					<SessionPaginationSkeleton />
				</div>

				{/* Session List Skeleton */}
				<SessionListViewSkeleton count={10} />
			</div>
		</div>
	);
}
