"use client";

import { ROLE_DISPLAY_NAMES } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { ChevronDown, ChevronRight, LogOut } from "@repo/ui/lib/lucide-react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { getFilteredNavItems, type NavigationItem } from "@/config/nav-items";
import { useAuth } from "@/contexts/auth-context";

function NavItem({
	item,
	pathname,
	userRole,
}: {
	item: NavigationItem;
	pathname: string;
	userRole: string | undefined;
}) {
	const isActive =
		pathname === item.href || pathname.startsWith(`${item.href}/`);
	const hasChildren = item.children && item.children.length > 0;
	const isChildActive = hasChildren
		? item.children?.some(
				(child) =>
					child.allowedRoles.includes(userRole as never) &&
					(pathname === child.href || pathname.startsWith(`${child.href}/`)),
			)
		: false;
	const [isExpanded, setIsExpanded] = useState(isActive || isChildActive);

	if (hasChildren) {
		const visibleChildren = item.children?.filter((child) =>
			child.allowedRoles.includes(userRole as never),
		);

		return (
			<div>
				<div className="flex items-center">
					<Link
						href={item.href}
						className={cn(
							"group flex flex-1 items-center gap-3 px-3 py-2 text-[14px] font-medium rounded-md transition-all duration-200",
							isActive && !isChildActive
								? "bg-[#dc2626] text-white shadow-sm"
								: "text-[#0a0a0a] hover:bg-gray-100 hover:text-[#dc2626]",
						)}
					>
						<item.icon
							className={cn(
								"size-4.5 shrink-0",
								isActive && !isChildActive
									? "text-white"
									: "text-[#4a5565] group-hover:text-[#dc2626]",
							)}
						/>
						<span className="truncate">{item.name}</span>
					</Link>
					{visibleChildren && visibleChildren.length > 0 && (
						<button
							type="button"
							onClick={() => setIsExpanded(!isExpanded)}
							className="p-1.5 rounded-md hover:bg-gray-100 text-[#4a5565]"
							aria-label={isExpanded ? "Collapse" : "Expand"}
						>
							{isExpanded ? (
								<ChevronDown className="size-3.5" />
							) : (
								<ChevronRight className="size-3.5" />
							)}
						</button>
					)}
				</div>
				{isExpanded && visibleChildren && visibleChildren.length > 0 && (
					<div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
						{visibleChildren.map((child) => {
							const childActive =
								pathname === child.href ||
								pathname.startsWith(`${child.href}/`);
							return (
								<Link
									key={child.href}
									href={child.href}
									className={cn(
										"group flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200",
										childActive
											? "bg-[#dc2626] text-white shadow-sm"
											: "text-[#0a0a0a] hover:bg-gray-100 hover:text-[#dc2626]",
									)}
								>
									<child.icon
										className={cn(
											"size-4 shrink-0",
											childActive
												? "text-white"
												: "text-[#4a5565] group-hover:text-[#dc2626]",
										)}
									/>
									<span className="truncate">{child.name}</span>
									{childActive && (
										<ChevronRight className="ml-auto size-3.5 text-white/70" />
									)}
								</Link>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	return (
		<Link
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
					isActive ? "text-white" : "text-[#4a5565] group-hover:text-[#dc2626]",
				)}
			/>
			<span className="truncate">{item.name}</span>
			{isActive && <ChevronRight className="ml-auto size-4 text-white/70" />}
		</Link>
	);
}

export function Sidebar() {
	const pathname = usePathname();
	const { userProfile, signOut } = useAuth();

	// Filter navigation items based on user role
	const filteredNavItems = useMemo(() => {
		return getFilteredNavItems(userProfile?.role?.name);
	}, [userProfile?.role?.name]);

	const handleLogout = async () => {
		await signOut();
	};

	return (
		<aside className="w-64 bg-white border-r border-[#e5e7eb] flex flex-col h-screen overflow-hidden">
			{/* Logo & Branding Section */}
			<div className="px-5 pt-6 pb-5 flex items-center gap-3">
				<img
					src="/iloilo-city-seal.png"
					alt="Iloilo City Council Seal"
					className="w-10 h-10 object-contain shrink-0"
				/>
				<div className="flex flex-col min-w-0">
					<span className="text-[13px] font-bold text-gray-900 leading-tight">
						Sangguniang Panlungsod
					</span>
					<span className="text-[11px] text-gray-600 leading-tight">
						ng Iloilo
					</span>
				</div>
			</div>

			{/* User Profile Card */}
			<div className="px-4 mb-4">
				<div className="bg-[#f9fafb] rounded-lg p-4">
					<div className="flex flex-col min-w-0">
						<span className="text-[14px] font-medium text-[#0a0a0a] truncate">
							{userProfile?.fullName ?? "Loading..."}
						</span>
						<div className="inline-flex mt-1">
							<span className="bg-[#eceef2] text-[#030213] text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider">
								{userProfile?.role?.name
									? ROLE_DISPLAY_NAMES[userProfile.role.name]
									: "—"}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
				{filteredNavItems.map((item) => (
					<NavItem
						key={item.href}
						item={item}
						pathname={pathname}
						userRole={userProfile?.role?.name}
					/>
				))}
			</nav>

			{/* Logout Button */}
			<div className="px-4 pb-4 pt-2 border-t border-[#e5e7eb]">
				<Button
					onClick={handleLogout}
					variant="ghost"
					className="w-full justify-start gap-3 text-[14px] font-medium text-[#0a0a0a] hover:bg-gray-100 hover:text-[#dc2626]"
				>
					<LogOut className="size-4.5 text-[#4a5565]" />
					<span>Logout</span>
				</Button>
			</div>
		</aside>
	);
}
