"use client";

import { Button } from "@repo/ui/components/button";
import {
	BookUser,
	Building2,
	CalendarDays,
	ChevronRight,
	ClipboardList,
	FileSearch,
	LayoutDashboard,
	LogOut,
	Ticket,
	UserCog,
	Users,
} from "@repo/ui/lib/lucide-react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationItem {
	name: string;
	href: string;
	icon: React.ElementType;
}

const navigationItems: NavigationItem[] = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Document Tracker", href: "/document-tracker", icon: FileSearch },
	{ name: "Caller's Slips", href: "/caller-slips", icon: ClipboardList },
	{
		name: "Session Management",
		href: "/session-management",
		icon: CalendarDays,
	},
	{ name: "Inquiry Tickets", href: "/inquiry-tickets", icon: Ticket },
	{
		name: "Visitor & Beneficiary Hub",
		href: "/visitor-and-beneficiary-hub",
		icon: Users,
	},
	{ name: "Conference Room", href: "/conference-room", icon: BookUser },
	{ name: "User Management", href: "/user-management", icon: UserCog },
];

export function Sidebar() {
	const pathname = usePathname();

	const handleLogout = () => {
		// TODO: Implement logout functionality
		console.log("Logout clicked");
	};

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

			{/* User Profile Card */}
			<div className="px-4 mb-4">
				<div className="bg-[#f9fafb] rounded-lg p-4">
					<div className="flex flex-col min-w-0">
						<span className="text-[14px] font-medium text-[#0a0a0a] truncate">
							UserName
						</span>
						<div className="inline-flex mt-1">
							<span className="bg-[#eceef2] text-[#030213] text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider">
								User-bla-bla-bla
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
				{navigationItems.map((item) => {
					const isActive = pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"group flex items-center gap-3 px-3 py-2 text-[14px] font-medium rounded-md transition-all duration-200",
								isActive
									? "bg-[#dc2626] text-white shadow-sm"
									: "text-[#0a0a0a] hover:bg-gray-100 hover:text-[#dc2626]",
							)}
						>
							<item.icon
								className={cn(
									"size-4.5 shrink-0",
									isActive
										? "text-white"
										: "text-[#4a5565] group-hover:text-[#dc2626]",
								)}
							/>
							<span className="truncate">{item.name}</span>
							{isActive && (
								<ChevronRight className="ml-auto size-4 text-white/70" />
							)}
						</Link>
					);
				})}
			</nav>

			{/* Footer / Logout */}
			<div className="p-4 border-t border-[rgba(0,0,0,0.1)]">
				<Button
					variant="ghost"
					className="w-full justify-start gap-3 px-3 text-[#e7000b] hover:text-[#dc2626] hover:bg-red-50 font-medium"
					onClick={handleLogout}
				>
					<LogOut className="size-4.5" />
					<span>Logout</span>
				</Button>
			</div>
		</aside>
	);
}
