"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { LayoutContent } from "@/components/layout/layout-content";
import { Sidebar } from "@/components/layout/sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	// Check if current route is an auth route
	const isAuthRoute = pathname.startsWith("/auth");

	// Auth routes render without sidebar/header
	if (isAuthRoute) {
		return <>{children}</>;
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
