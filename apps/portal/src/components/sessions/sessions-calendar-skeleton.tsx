"use client";

import { Card } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";

export function SessionsCalendarSkeleton() {
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const totalCells = 35; // 5 weeks typical calendar view

	return (
		<Card className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-4 sm:p-6">
			{/* Calendar Header */}
			<div className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-0">
				<div className="flex items-center gap-2">
					{/* Month Selector skeleton */}
					<Skeleton className="h-9 w-35" />
					{/* Year Selector skeleton */}
					<Skeleton className="h-9 w-25" />
				</div>
				<div className="flex gap-2">
					{/* Today button skeleton */}
					<Skeleton className="h-9 w-16" />
					{/* Previous button skeleton */}
					<Skeleton className="h-9 w-9" />
					{/* Next button skeleton */}
					<Skeleton className="h-9 w-9" />
				</div>
			</div>

			{/* Calendar Grid */}
			<div className="mb-4">
				{/* Day headers */}
				<div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
					{dayNames.map((day) => (
						<div key={day} className="text-center">
							<p className="text-xs sm:text-sm font-semibold text-[#4a5565]">
								{day}
							</p>
						</div>
					))}
				</div>

				{/* Calendar cells */}
				<div className="grid grid-cols-7 gap-1 sm:gap-2">
					{Array.from({ length: totalCells }, (_, i) => (
						<div
							key={i}
							className="flex aspect-square flex-col overflow-hidden rounded-lg border border-[rgba(0,0,0,0.1)] bg-white p-1 sm:p-2"
						>
							<Skeleton className="mb-0.5 h-4 w-6 sm:mb-1" />
							{/* Randomly show session indicators for some cells */}
							{i % 4 === 0 && (
								<div className="mt-1 space-y-0.5 sm:space-y-1">
									<Skeleton className="h-2 w-6 rounded sm:h-4 sm:w-16" />
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Legend skeleton */}
			<div className="flex flex-col gap-3">
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
					<Skeleton className="h-6 w-45" />
					<Skeleton className="h-6 w-45" />
				</div>
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
					<Skeleton className="h-6 w-45" />
					<Skeleton className="h-6 w-45" />
				</div>
			</div>
		</Card>
	);
}
