import { Card } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";

export function DocumentDetailSkeleton() {
	return (
		<div className="min-h-screen bg-gray-50 pb-12">
			{/* Back button skeleton */}
			<div className="sticky top-18 sm:top-22 z-30 bg-white border-b border-gray-200 shadow-sm">
				<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-4">
					<Skeleton className="h-9 w-40" />
				</div>
			</div>

			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8 space-y-6">
				{/* Document Header Skeleton */}
				<article className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
					<div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
						<Skeleton className="h-6 w-28 rounded-full" />
						<Skeleton className="h-6 w-36 rounded-full" />
					</div>

					{/* Document Number */}
					<Skeleton className="h-5 sm:h-6 w-48 mb-3" />

					{/* Title */}
					<Skeleton className="h-8 sm:h-10 md:h-12 w-full mb-3" />
					<Skeleton className="h-8 sm:h-10 md:h-12 w-3/4 mb-6" />

					{/* Date Enacted Box */}
					<Skeleton className="h-20 w-48 rounded-lg" />
				</article>

				{/* Grid: Sidebar first on mobile, Viewer first on desktop */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="order-2 lg:order-1 lg:col-span-2 flex flex-col gap-4">
						<Skeleton className="h-64 md:h-200 w-full rounded-xl" />
						<Skeleton className="h-16 w-full rounded-xl" />
					</div>
					<div className="order-1 lg:order-2 lg:col-span-1">
						<Skeleton className="h-72 w-full rounded-xl" />
					</div>
				</div>
			</div>
		</div>
	);
}
