import { Skeleton } from "@repo/ui/components/skeleton";

export function SidebarSkeleton() {
	return (
		<aside className="w-64 bg-white border-r border-[#e5e7eb] flex flex-col h-screen overflow-hidden">
			{/* Logo Section */}
			<div className="px-5 pt-6 pb-5 flex items-center gap-3">
				<Skeleton className="size-10 rounded-full shrink-0" />
				<div className="flex flex-col gap-1.5 w-full">
					<Skeleton className="h-3.5 w-32" />
					<Skeleton className="h-3 w-16" />
				</div>
			</div>

			{/* User Profile Card Skeleton */}
			<div className="px-4 mb-4">
				<div className="bg-[#f9fafb] rounded-lg p-4">
					<div className="flex flex-col min-w-0 space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-5 w-24 rounded-md" />
					</div>
				</div>
			</div>

			{/* Navigation Skeleton */}
			<nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
				{[...Array(8)].map((_, i) => (
					<div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md">
						<Skeleton className="size-4.5 shrink-0 rounded" />
						<Skeleton className="h-4 flex-1" />
					</div>
				))}
			</nav>
		</aside>
	);
}
