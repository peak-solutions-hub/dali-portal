import { ROLE_DISPLAY_NAMES, type RoleType } from "../enums/role";

// Re-export for convenience
export { ROLE_DISPLAY_NAMES } from "../enums/role";

/**
 * Converts a role enum value to its proper display name
 * @param roleType - The role enum value (e.g., "it_admin")
 * @returns The formatted display name (e.g., "IT Administrator")
 * @example
 * formatRoleDisplay("it_admin") // "IT Administrator"
 * formatRoleDisplay("ovm_staff") // "OVM Staff"
 */
export function formatRoleDisplay(roleType: RoleType): string {
	return ROLE_DISPLAY_NAMES[roleType] || roleType;
}

/**
 * Get consistent badge styles for role badges across the application
 * @returns Tailwind CSS classes for role badge styling
 */
export function getRoleBadgeStyles(): string {
	return "bg-[rgba(166,2,2,0.08)] border border-[rgba(166,2,2,0.25)] text-[#a60202] font-medium";
}

export function getStatusBadgeStyles(status: string): string {
	if (status === "active") {
		return "bg-[#dcfce7] border-[#b9f8cf] text-[#016630]";
	}
	if (status === "invited") {
		return "bg-[#dbeafe] border-[#bedbff] text-[#193cb8]";
	}
	if (status === "deactivated") {
		return "bg-[#f3f4f6] border-[#d1d5db] text-[#6b7280]";
	}
	return "bg-[#f3f4f6] border-[#d1d5db] text-[#6b7280]";
}
