import { Skeleton } from "@repo/ui/components/skeleton";

export function SessionDetailSkeleton() {
	const agendaItemsCount = 13; // Typical agenda items count

	return (
		<>
			{/* Back Button */}
			<div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
				<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-4">
					<Skeleton className="h-8 w-40" />
				</div>
			</div>

			{/* Main Card */}
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				<div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
					{/* Session Header */}
					<div className="mb-8 md:mb-12 space-y-4">
						{/* Badges */}
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<Skeleton className="h-5 w-24 sm:h-6 sm:w-28" />
							<Skeleton className="h-5 w-20 sm:h-6 sm:w-24" />
							<Skeleton className="h-4 w-24 sm:h-5 sm:w-32" />
						</div>

						{/* Date */}
						<Skeleton className="h-8 w-full max-w-xs sm:h-9 sm:max-w-sm" />

						{/* Time */}
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-12 sm:h-6 sm:w-14" />
							<Skeleton className="h-5 w-32 sm:h-6 sm:w-40" />
						</div>
					</div>

					{/* Session Agenda */}
					<div className="border-t border-gray-200 pt-8">
						<Skeleton className="mb-6 h-6 w-36 sm:h-7 sm:w-44" />

						<div className="space-y-6">
							{Array.from({ length: agendaItemsCount }, (_, i) => (
								<div
									key={i}
									className="border-l-4 border-primary pl-4 sm:pl-7 py-2"
								>
									{/* Section title */}
									<Skeleton className="h-4 w-48 sm:h-5 sm:w-56" />

									{/* Content text (some items have it) */}
									{i % 3 === 0 && (
										<Skeleton className="mt-2 sm:mt-3 h-4 w-full max-w-xl sm:max-w-2xl" />
									)}

									{/* Linked document (some items have it) */}
									{i % 5 === 0 && (
										<div className="mt-2 sm:mt-3">
											<Skeleton className="h-4 w-40 sm:w-48" />
										</div>
									)}

									{/* Attachment (some items have it) */}
									{i % 7 === 0 && (
										<div className="mt-2 sm:mt-3">
											<Skeleton className="h-3 w-36 sm:h-4 sm:w-44" />
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
