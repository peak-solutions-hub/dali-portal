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
