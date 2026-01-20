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
	"/conference-room": "Conference Room Booking",
	"/user-management": "User Management",
};

export function LayoutContent({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	// Find the matching page title, default to 'Dashboard' if not found
	const pageTitle = PAGE_TITLES[pathname] || "Dashboard";

	return (
		<>
			<Header title={pageTitle} />
			<main className="flex-1 overflow-y-auto p-6">{children}</main>
		</>
	);
}
