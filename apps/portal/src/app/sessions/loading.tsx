import { Skeleton } from "@repo/ui/components/skeleton";
import {
	SessionListViewSkeleton,
	SessionPaginationSkeleton,
	SessionsCalendarSkeleton,
} from "@/components/sessions";

interface LoadingPageProps {
	view: "list" | "calendar";
}

/**
 * View-specific loading skeleton.
 * Server-rendered with zero client JS.
 */
export default function LoadingPage({ view }: LoadingPageProps) {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-3 sm:py-4">
				{/* Page Header Skeleton */}
				<div className="mb-6">
					<Skeleton className="h-9 w-70 sm:w-80 mb-2" />
					<Skeleton className="h-5 w-86 sm:w-96" />
				</div>

				{/* Desktop: Sticky Group (Filters + Sort + Pagination) */}
				<div className="hidden lg:block lg:sticky lg:top-0 lg:z-30 lg:pb-4">
					<div className="flex flex-col gap-4 lg:bg-gray-50 lg:pt-4">
						<div className="flex items-start justify-between gap-4">
							{/* Left Group: Sort & Filters */}
							<div className="flex items-start gap-4 flex-1">
								{view !== "calendar" && <Skeleton className="h-9 w-40" />}{" "}
								{/* Sort */}
								{view !== "calendar" && <Skeleton className="h-9 w-24" />}{" "}
								{/* Filter Button */}
							</div>

							{/* Right Group: View Toggle */}
							<div className="flex gap-2 shrink-0">
								<Skeleton className="h-9 w-28" /> {/* Calendar Toggle */}
								<Skeleton className="h-9 w-20" /> {/* List Toggle */}
							</div>
						</div>

						{/* Pagination */}
						{view !== "calendar" && <SessionPaginationSkeleton />}
					</div>
				</div>

				{/* Mobile: Sticky Group (Sort + Buttons + Filters) */}
				<div className="lg:hidden sticky top-0 z-30 bg-gray-50 pb-4 pt-4">
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-3">
							{/* Sort and Toggle Row */}
							<div className="flex justify-between gap-3">
								<Skeleton
									className={`${view !== "calendar" ? "h-9 w-full" : "bg-transparent"}`}
								/>{" "}
								{/* Sort */}
								<div className="flex shrink-0 gap-2">
									<Skeleton className="h-9 w-10 sm:w-28" />{" "}
									{/* Calendar Toggle */}
									<Skeleton className="h-9 w-10 sm:w-20" /> {/* List Toggle */}
								</div>
							</div>
							{/* Filters */}
							{view !== "calendar" && <Skeleton className="h-9 w-24" />}
							{/* Filter Button */}
						</div>
					</div>
				</div>

				{/* Conditional Skeleton Based on View */}
				{view === "calendar" ? (
					<SessionsCalendarSkeleton />
				) : (
					<>
						{/* Session List Skeleton */}
						<div className="pb-24 lg:pb-0">
							<SessionListViewSkeleton count={10} />
						</div>

						{/* Mobile Pagination - Sticky bottom */}
						<div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 p-4 shadow-lg">
							<SessionPaginationSkeleton />
						</div>
					</>
				)}
			</div>
		</div>
	);
}
