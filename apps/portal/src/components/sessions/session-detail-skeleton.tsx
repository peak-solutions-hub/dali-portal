import { Skeleton } from "@repo/ui/components/skeleton";

export function SessionDetailSkeleton() {
	const agendaItemsCount = 13; // Typical agenda items count

	return (
		<>
			{/* Back Button skeleton */}
			<div className="mb-8 inline-block">
				<Skeleton className="h-8 w-32 sm:h-9" />
			</div>

			{/* Main Card */}
			<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
				{/* Session Header */}
				<div className="mb-12 space-y-4">
					{/* Badges skeleton */}
					<div className="flex gap-3">
						<Skeleton className="h-6 w-28" />
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-5 w-20" />
					</div>

					{/* Date skeleton */}
					<Skeleton className="h-9 w-96" />

					{/* Time skeleton */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-6 w-32" />
					</div>
				</div>

				{/* Session Agenda */}
				<div className="border-t border-gray-200 pt-8">
					{/* Title skeleton */}
					<Skeleton className="mb-6 h-8 w-48" />

					<div className="space-y-6">
						{Array.from({ length: agendaItemsCount }, (_, i) => (
							<div key={i} className="border-l-4 border-primary pl-7 py-2">
								{/* Agenda item title */}
								<Skeleton className="h-5 w-64 mb-3" />
								{/* Agenda item description (not all items have it) */}
								{i % 3 === 0 && <Skeleton className="h-4 w-full max-w-2xl" />}
								{/* Linked document (not all items have it) */}
								{i % 5 === 0 && (
									<div className="mt-3">
										<Skeleton className="h-4 w-48" />
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	);
}
