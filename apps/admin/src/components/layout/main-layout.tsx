"use client";

import { Toaster } from "sonner";
import { LayoutContent } from "@/components/layout/layout-content";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarSkeleton } from "@/components/layout/sidebar-skeleton";
import { useAuth } from "@/contexts/auth-context";

export function MainLayout({ children }: { children: React.ReactNode }) {
	const { isLoading, userProfile } = useAuth();

	// No redirect logic here - auth-context is the single source of truth

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
				</div>
			</div>
		);
	}

	// Block rendering for deactivated users (redirect is in-flight)
	if (userProfile?.status === "deactivated") {
		return null;
	}

	// If profile is null after loading, show redirect message while redirect happens
	if (!isLoading && !userProfile) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-[#f9fafb]">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-sm text-muted-foreground">Redirecting...</p>
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
				<Toaster position="bottom-right" richColors />
			</div>
		</div>
	);
}
