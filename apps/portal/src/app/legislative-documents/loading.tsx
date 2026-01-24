import { Skeleton } from "@repo/ui/components/skeleton";
import { DocumentListSkeleton } from "@/components/legislative-documents/document-card-skeleton";

export default function LoadingPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-3 sm:py-4">
				{/* Page header skeleton */}
				<div className="mb-6">
					<Skeleton className="h-9 w-80 mb-2" />
					<Skeleton className="h-5 w-96" />
				</div>

				{/* Search and filters skeleton - Sticky */}
				<div className="sticky top-16 sm:top-20 z-30 bg-gray-50 pt-4 pb-4">
					<div className="flex flex-col gap-3 w-full">
						<div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full">
							{/* Search input skeleton */}
							<Skeleton className="h-10 w-full md:w-80" />
							{/* Filter skeleton */}
							<Skeleton className="h-10 w-24" />
						</div>
					</div>
				</div>

				{/* Desktop Pagination skeleton - Hidden on mobile */}
				<div className="hidden lg:block sticky top-38.5 z-20 bg-white py-3 px-4 shadow-sm">
					<div className="container mx-auto px-4 flex items-center justify-between w-full">
						<Skeleton className="h-5 w-48" />
						<div className="flex gap-2 justify-end">
							<Skeleton className="h-9 w-24" />
							<Skeleton className="h-9 w-9" />
							<Skeleton className="h-9 w-9" />
							<Skeleton className="h-9 w-9" />
							<Skeleton className="h-9 w-24" />
						</div>
					</div>
				</div>

				{/* Document list skeleton */}
				<div className="flex flex-col gap-4 pt-4 pb-24 lg:pb-4">
					<DocumentListSkeleton count={10} />
				</div>

				{/* Mobile Pagination - Sticky bottom */}
				<div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white py-3 px-4 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
					<div className="container mx-auto px-4 flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
						<Skeleton className="h-5 w-48 mx-auto sm:mx-0" />
						<div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
							<Skeleton className="h-9 w-24" />
							<Skeleton className="h-9 w-9" />
							<Skeleton className="h-9 w-9" />
							<Skeleton className="h-9 w-9" />
							<Skeleton className="h-9 w-24" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
