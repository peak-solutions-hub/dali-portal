"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";

const PAGE_TITLES: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/document-tracker": "Document Tracker",
	"/caller-slips": "Caller's Slips",
	"/session-management": "Session Management",
	"/inquiry-tickets": "Inquiry Tickets",
	"/visitor-and-beneficiary-hub": "Visitor & Beneficiary Hub",
	"/conference-room": "Conference Room",
	"/user-management": "User Management",
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
	"/session-management": "Manage session agendas & documents.",
};

export function LayoutContent({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	// Find the matching page title, default to 'Dashboard' if not found
	const pageTitle = PAGE_TITLES[pathname] || "Dashboard";
	const pageDescription = PAGE_DESCRIPTIONS[pathname];

	return (
		<>
			<Header title={pageTitle} description={pageDescription} />
			<main className="flex-1 overflow-y-auto p-6">{children}</main>
		</>
	);
}
