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
						<header className="mb-6 sm:mb-8">
							{/* Document Number */}
							<Skeleton className="h-8 sm:h-9 md:h-10 w-64 mb-3 sm:mb-4" />

							{/* Title */}
							<Skeleton className="h-6 sm:h-7 md:h-8 w-full mb-2" />
							<Skeleton className="h-6 sm:h-7 md:h-8 w-3/4 mb-4 sm:mb-6" />

							{/* Metadata Grid */}
							<div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
									{Array.from({ length: 5 }).map((_, i) => (
										<div key={i} className="space-y-2">
											<Skeleton className="h-4 w-36" />
											<Skeleton className="h-5 w-48" />
										</div>
									))}
								</div>
							</div>
						</header>

						{/* PDF Viewer Skeleton - Two buttons */}
						<div className="mb-4 sm:mb-6">
							<div className="flex flex-col sm:flex-row gap-3">
								<Skeleton className="h-14 w-full sm:w-48" />
								<Skeleton className="h-14 w-full sm:w-48" />
							</div>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
