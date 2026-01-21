"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { LayoutContent } from "@/components/layout/layout-content";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarSkeleton } from "@/components/layout/sidebar-skeleton";
import { useAuth } from "@/contexts/auth-context";

export function MainLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { isLoading } = useAuth();

	// Check if current route is an auth route
	const isAuthRoute = pathname.startsWith("/auth");

	// Auth routes render without sidebar/header (and without loading check)
	if (isAuthRoute) {
		return <>{children}</>;
	}

	// Show sidebar skeleton while auth is loading
	if (isLoading) {
		return (
			<div className="flex h-screen overflow-hidden bg-[#f9fafb]">
				<SidebarSkeleton />
				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="flex h-screen w-full items-center justify-center">
						<div className="flex flex-col items-center gap-4">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p className="text-sm text-muted-foreground">Loading...</p>
						</div>
					</div>
					<Toaster position="top-right" richColors />
				</div>
			</div>
		);
	}

	// Regular routes render with sidebar/header (only after auth is ready)
	return (
		<div className="flex h-screen overflow-hidden bg-[#f9fafb]">
			<Sidebar />
			<div className="flex-1 flex flex-col overflow-hidden">
				<LayoutContent>{children}</LayoutContent>
				<Toaster position="top-right" richColors />
			</div>
		</div>
	);
}
