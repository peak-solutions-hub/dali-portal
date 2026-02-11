import { Skeleton } from "@repo/ui/components/skeleton";

export function SessionDetailSkeleton() {
	const sectionCount = 12; // Number of agenda sections

	return (
		<>
			{/* Back Button — sticky below fixed header */}
			<div className="sticky top-18 sm:top-22 z-30 bg-white border-b border-gray-200 shadow-sm">
				<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-4">
					<Skeleton className="h-8 w-40 rounded-md" />
				</div>
			</div>

			{/* Main Card */}
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				<div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
					{/* Session Header */}
					<div className="mb-8 md:mb-12 space-y-4">
						{/* Badges */}
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<Skeleton className="h-5 w-24 sm:h-6 sm:w-28 rounded-full" />
							<Skeleton className="h-5 w-20 sm:h-6 sm:w-24 rounded-full" />
							<Skeleton className="h-4 w-24 sm:h-5 sm:w-32" />
						</div>

						{/* Date */}
						<Skeleton className="h-8 w-full max-w-xs sm:h-9 sm:max-w-sm" />

						{/* Time */}
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-12 sm:h-6 sm:w-14" />
							<Skeleton className="h-5 w-32 sm:h-6 sm:w-40" />
						</div>

						{/* Download PDF button */}
						<Skeleton className="h-9 w-36 rounded-lg" />
					</div>

					{/* Session Agenda */}
					<div className="border-t border-gray-200 pt-8">
						{/* View Switcher Tabs */}
						<div className="mb-6 flex gap-2">
							<Skeleton className="h-9 w-20 rounded-md" />
							<Skeleton className="h-9 w-28 rounded-md" />
							<Skeleton className="h-9 w-16 rounded-md" />
						</div>

						{/* Layout: Quick Nav sidebar + Agenda sections */}
						<div className="flex flex-col lg:flex-row lg:gap-8">
							{/* Quick Nav — mobile inline card */}
							<div className="lg:hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6">
								<Skeleton className="h-3 w-32 mb-3" />
								<div className="space-y-2">
									{Array.from({ length: 6 }, (_, i) => (
										<Skeleton key={i} className="h-8 w-full rounded-r-md" />
									))}
								</div>
							</div>

							{/* Quick Nav — desktop sticky sidebar */}
							<div className="hidden lg:block sticky top-24 w-64 shrink-0 self-start rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
								<Skeleton className="h-3 w-20 mb-3 ml-3" />
								<div className="space-y-1">
									{Array.from({ length: sectionCount }, (_, i) => (
										<Skeleton
											key={i}
											className={`h-8 rounded-r-md ${
												i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-4/5"
											}`}
										/>
									))}
								</div>
							</div>

							{/* Agenda Sections */}
							<div className="flex-1 min-w-0 space-y-6">
								{Array.from({ length: sectionCount }, (_, i) => (
									<div
										key={i}
										className="border-l-4 border-primary pl-4 sm:pl-7 py-2"
									>
										{/* Section title */}
										<Skeleton className="h-4 w-48 sm:h-5 sm:w-64" />

										{/* Content / document placeholders for some sections */}
										{i >= 5 && i <= 9 && (
											<div className="mt-3 space-y-3">
												<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
													<div className="flex items-start gap-3">
														<Skeleton className="h-5 w-5 rounded shrink-0" />
														<div className="flex-1 space-y-2">
															<Skeleton className="h-4 w-32" />
															<Skeleton className="h-4 w-full max-w-md" />
															<Skeleton className="h-3 w-16" />
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
