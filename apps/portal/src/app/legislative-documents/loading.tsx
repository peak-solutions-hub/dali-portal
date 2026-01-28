import { Skeleton } from "@repo/ui/components/skeleton";
import { DocumentListSkeleton } from "@/components/legislative-documents/document-card-skeleton";

export default function LoadingPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-3 sm:py-4">
				{/* Page header skeleton */}
				<div className="mb-6">
					<Skeleton className="h-9 w-80 mb-2" />
					<Skeleton className="h-5 w-80" />
				</div>

				{/* Search and filters skeleton - Sticky */}
				<div className="sticky top-16 sm:top-20 z-30 bg-gray-50 pt-4 pb-2">
					<div className="flex flex-col gap-3 w-full">
						<div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full">
							{/* Search input skeleton */}
							<Skeleton className="h-10 w-full md:w-80" />
							{/* Filter skeleton */}
							<Skeleton className="h-10 w-20" />
						</div>
					</div>
				</div>

				{/* Desktop Pagination skeleton - Hidden on mobile */}
				<div className="hidden lg:block lg:sticky lg:top-0 lg:z-30 lg:pb-4">
					<div className="flex flex-col gap-4 lg:bg-gray-50 lg:pt-4">
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
					</div>
				</div>

				{/* Document list skeleton */}
				<div className="flex flex-col gap-4 pt-4 pb-24 lg:pb-4">
					<DocumentListSkeleton count={10} />

					<div className="lg:hidden sticky bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 p-4 shadow-lg">
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
					</div>
				</div>
			</div>
		</div>
	);
}
