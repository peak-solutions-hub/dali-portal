import { ROLE_PERMISSIONS, type RoleType } from "@repo/shared";
import {
	BookUser,
	CalendarDays,
	ClipboardList,
	FileSearch,
	LayoutDashboard,
	Ticket,
	UserCog,
	Users,
} from "@repo/ui/lib/lucide-react";

export interface NavigationItem {
	name: string;
	href: string;
	icon: React.ElementType;
	allowedRoles: RoleType[];
}

/**
 * Navigation items with role-based access control
 * Uses ROLE_PERMISSIONS from shared package to ensure consistency with backend
 */
export const navigationItems: NavigationItem[] = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		allowedRoles: ROLE_PERMISSIONS.DASHBOARD,
	},
	{
		name: "Document Tracker",
		href: "/document-tracker",
		icon: FileSearch,
		allowedRoles: ROLE_PERMISSIONS.DOCUMENT_TRACKER,
	},
	{
		name: "Caller's Slips",
		href: "/caller-slips",
		icon: ClipboardList,
		allowedRoles: ROLE_PERMISSIONS.CALLER_SLIPS,
	},
	{
		name: "Session Management",
		href: "/session-management",
		icon: CalendarDays,
		allowedRoles: ROLE_PERMISSIONS.SESSION_MANAGEMENT,
	},
	{
		name: "Inquiry Tickets",
		href: "/inquiry-tickets",
		icon: Ticket,
		allowedRoles: ROLE_PERMISSIONS.INQUIRY_TICKETS,
	},
	{
		name: "Visitor & Beneficiary Hub",
		href: "/visitor-and-beneficiary-hub",
		icon: Users,
		allowedRoles: ROLE_PERMISSIONS.VISITOR_BENEFICIARY_HUB,
	},
	{
		name: "Conference Room",
		href: "/conference-room",
		icon: BookUser,
		allowedRoles: ROLE_PERMISSIONS.CONFERENCE_ROOM,
	},
	{
		name: "User Management",
		href: "/user-management",
		icon: UserCog,
		allowedRoles: ROLE_PERMISSIONS.USER_MANAGEMENT,
	},
];

/**
 * Filter navigation items based on user role
 * @param role - The user's role
 * @returns Filtered navigation items the user has access to
 */
export function getFilteredNavItems(
	role: RoleType | undefined,
): NavigationItem[] {
	if (!role) {
		return [];
	}
	return navigationItems.filter((item) => item.allowedRoles.includes(role));
}
