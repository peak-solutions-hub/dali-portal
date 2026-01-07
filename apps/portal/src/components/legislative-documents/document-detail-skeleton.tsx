import { Card } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";

export function DocumentDetailSkeleton() {
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Back button skeleton */}
			<div className="bg-white border-b border-gray-200">
				<div className="container mx-auto px-4 py-4">
					<Skeleton className="h-9 w-40" />
				</div>
			</div>

			<div className="container mx-auto px-4 py-8">
				<Card className="p-4 sm:p-6 md:p-8">
					<div className="space-y-6">
						{/* Document Header Skeleton */}
						<div className="space-y-4">
							{/* Document number and type */}
							<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
								<Skeleton className="h-8 w-48" />
								<Skeleton className="h-6 w-32" />
							</div>

							{/* Title */}
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-3/4" />

							{/* Metadata grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-5 w-32" />
									</div>
								))}
							</div>

							{/* Authors/Sponsors */}
							<div className="space-y-2 pt-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-5 w-64" />
							</div>
						</div>

						{/* PDF Viewer Skeleton */}
						<div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
							<div className="flex items-center justify-between mb-4">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-10 w-32" />
							</div>
							<Skeleton className="h-150 w-full rounded" />
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
