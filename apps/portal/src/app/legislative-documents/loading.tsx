import { Skeleton } from "@repo/ui/components/skeleton";
import { DocumentListSkeleton } from "@/components/legislative-documents/document-card-skeleton";

export default function LoadingPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				{/* Page header skeleton */}
				<div className="mb-6">
					<Skeleton className="h-9 w-80 mb-1" />
					<Skeleton className="h-5 w-96" />
				</div>

				{/* Search and filters skeleton - matches SearchFilterBar */}
				<div className="sticky top-19 z-20 bg-gray-50 pt-6 pb-4 mb-0 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-gray-200">
					<div className="container mx-auto flex flex-col md:flex-row gap-3 items-start md:items-center justify-between w-full">
						{/* Search input skeleton */}
						<Skeleton className="h-10 w-full md:w-80" />

						{/* Filters skeleton */}
						<div className="flex gap-3 items-center flex-wrap">
							<Skeleton className="h-10 w-48" />
							<Skeleton className="h-10 w-36" />
							<Skeleton className="h-10 w-52" />
						</div>
					</div>
				</div>

				{/* Pagination skeleton - matches PaginationControls */}
				<div className="sticky top-38.5 z-20 bg-white py-3 px-4 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-gray-200 shadow-sm">
					<div className="container mx-auto px-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between w-full">
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

				{/* Document list skeleton */}
				<DocumentListSkeleton count={10} />
			</div>
		</div>
	);
}
