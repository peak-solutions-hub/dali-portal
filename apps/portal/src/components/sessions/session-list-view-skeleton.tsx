import { Card } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";

interface SessionListViewSkeletonProps {
	count?: number;
}

export function SessionListViewSkeleton({
	count = 10,
}: SessionListViewSkeletonProps) {
	return (
		<div className="space-y-3 sm:space-y-4">
			{Array.from({ length: count }, (_, i) => (
				<Card
					key={i}
					className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-4 sm:p-6 transition-shadow hover:shadow-lg"
				>
					<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
						<div className="w-full flex-1 space-y-2">
							{/* Badges skeleton */}
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<Skeleton className="h-5 sm:h-7 w-28 rounded-md" />
								<Skeleton className="h-5 sm:h-7 w-24 rounded-md" />
								<Skeleton className="h-4 sm:h-6 w-20" />
							</div>
							{/* Date skeleton */}
							<Skeleton className="h-6 w-44 sm:h-7 sm:w-64" />
							{/* Time skeleton */}
							<Skeleton className="h-4 w-24 sm:h-5" />
						</div>
						{/* Button skeleton (full width on mobile, auto on sm+) */}
						<Skeleton className="h-8 w-full sm:h-9 sm:w-auto sm:min-w-28 rounded-md" />
					</div>
				</Card>
			))}
		</div>
	);
}
