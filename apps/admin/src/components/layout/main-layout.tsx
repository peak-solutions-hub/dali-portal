"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { LayoutContent } from "@/components/layout/layout-content";
import { Sidebar } from "@/components/layout/sidebar";
import { useRoleProtection } from "@/hooks/use-role-protection";

export function MainLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { isLoading } = useRoleProtection();

	// Check if current route is an auth route
	const isAuthRoute = pathname.startsWith("/auth");

	// Auth routes render without sidebar/header
	if (isAuthRoute) {
		return <>{children}</>;
	}

	// Show loading state while checking permissions
	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-[#f9fafb]">
				<div className="text-center">
					<div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-[#dc2626] border-r-transparent" />
					<p className="mt-4 text-sm text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// Regular routes render with sidebar/header
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
