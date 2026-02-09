"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { LayoutContent } from "@/components/layout/layout-content";
import { Sidebar } from "@/components/layout/sidebar";

const STANDALONE_PREFIXES = ["/session-presenter", "/session-display"];

function isStandalonePath(pathname: string) {
	return STANDALONE_PREFIXES.some((p) => pathname.startsWith(p));
}

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const standalone = isStandalonePath(pathname);

	if (standalone) return <>{children}</>;

	return (
		<div className="flex h-screen overflow-hidden bg-[#f9fafb]">
			<Sidebar />
			<div className="flex-1 flex flex-col overflow-hidden">
				<LayoutContent>{children}</LayoutContent>
			</div>
		</div>
	);
}
