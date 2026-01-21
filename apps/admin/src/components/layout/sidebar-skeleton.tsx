import { Skeleton } from "@repo/ui/components/skeleton";
import { Building2 } from "@repo/ui/lib/lucide-react";

export function SidebarSkeleton() {
	return (
		<aside className="w-64 bg-white border-r border-[#e5e7eb] flex flex-col h-screen overflow-hidden">
			{/* Logo Section */}
			<div className="px-6 pt-6 pb-4 flex items-center gap-3">
				<div className="size-10 bg-[#dc2626] rounded-full flex items-center justify-center shrink-0">
					<div className="size-6 text-white">
						<Building2 />
					</div>
				</div>
				<div className="flex flex-col">
					<span className="text-[14px] font-semibold text-[#0a0a0a] leading-tight">
						Iloilo City
					</span>
					<span className="text-[12px] text-[#4a5565]">Council</span>
				</div>
			</div>

			{/* User Profile Card Skeleton */}
			<div className="px-4 mb-4">
				<div className="bg-[#f9fafb] rounded-lg p-4">
					<div className="flex flex-col min-w-0 space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-20" />
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
