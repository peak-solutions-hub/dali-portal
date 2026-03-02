"use client";

import { Skeleton } from "@repo/ui/components/skeleton";

/**
 * Skeleton placeholder for the session management two-panel layout.
 * Shown once while both document list and sessions are loading.
 */
export function SessionPageSkeleton() {
	return (
		<div className="flex gap-4 flex-1 overflow-hidden">
			{/* Left Panel — Documents skeleton */}
			<div className="w-113.5 shrink-0">
				<div className="flex h-full w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-5 rounded" />
							<Skeleton className="h-5 w-32" />
						</div>
						<div className="flex gap-1">
							<Skeleton className="h-5 w-14 rounded-full" />
							<Skeleton className="h-5 w-14 rounded-full" />
						</div>
					</div>

					<Skeleton className="h-4 w-64" />

					{/* Filter bar */}
					<div className="flex gap-2">
						<Skeleton className="h-9 flex-1 rounded-md" />
						<Skeleton className="h-9 w-36 rounded-md" />
					</div>

					{/* Document cards */}
					<div className="flex flex-col gap-2 flex-1">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton key={`doc-${i}`} className="h-16 w-full rounded-lg" />
						))}
					</div>
				</div>
			</div>

			{/* Right Panel — Agenda skeleton */}
			<div className="flex-1">
				<div className="flex h-full w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5">
					{/* Session selector */}
					<Skeleton className="h-10 w-full rounded-md" />

					{/* Status banner */}
					<Skeleton className="h-8 w-48 rounded-md" />

					{/* Agenda items */}
					<div className="flex flex-col gap-3 flex-1">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={`section-${i}`} className="flex flex-col gap-2">
								<Skeleton className="h-6 w-40 rounded" />
								<Skeleton className="h-20 w-full rounded-lg" />
							</div>
						))}
					</div>

					{/* Action bar */}
					<div className="flex justify-end gap-2">
						<Skeleton className="h-9 w-24 rounded-md" />
						<Skeleton className="h-9 w-24 rounded-md" />
					</div>
				</div>
			</div>
		</div>
	);
}
