import { Card } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";

export function DocumentCardSkeleton() {
	return (
		<Card className="overflow-hidden hover:shadow-md focus-within:shadow-md transition-all border-l-4 border-l-[#a60202]">
			<article className="px-5">
				<div className="flex items-start justify-between gap-4">
					{/* Left Content */}
					<div className="flex-1">
						{/* Type Badge, Number, and Year */}
						<div className="flex items-center gap-3 mb-2 flex-wrap">
							<Skeleton className="h-6 w-32 rounded" /> {/* Badge */}
							<Skeleton className="h-5 w-24" /> {/* Document Number */}
							<Skeleton className="h-4 w-16" /> {/* Year */}
						</div>

						{/* Title */}
						<Skeleton className="h-6 w-full mb-2" />

						{/* Metadata */}
						<div className="flex flex-wrap gap-x-4 gap-y-1">
							<Skeleton className="h-5 w-48" /> {/* Author */}
							<Skeleton className="h-5 w-44" /> {/* Sponsor */}
							<Skeleton className="h-5 w-40" /> {/* Date Passed */}
						</div>

						{/* Classification */}
						<div className="mt-2">
							<Skeleton className="h-5 w-56" />
						</div>
					</div>

					{/* Right Action Buttons */}
					<div className="flex flex-col gap-2 shrink-0">
						<Skeleton className="h-10 w-28" /> {/* Read More Button */}
						<Skeleton className="h-10 w-28" /> {/* Download Button */}
					</div>
				</div>
			</article>
		</Card>
	);
}

export function DocumentListSkeleton({ count = 10 }: { count?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, i) => (
				<DocumentCardSkeleton key={i} />
			))}
		</div>
	);
}
