import type { RoleType } from "../enums/role";

/**
 * @fileoverview Role-Based Access Control (RBAC) Permissions
 *
 * This file defines role permissions for all features in the DALI Portal system.
 * Permissions are aligned with both frontend navigation and backend API routes.
 *
 * Usage:
 * - Frontend: Filter navigation items based on user role
 * - Backend: Enforce access control with @Roles() decorator
 * - Shared: Ensure consistency across UI and API
 */

/**
 * All roles in the system for convenience
 */
export const ALL_ROLES: RoleType[] = [
	"it_admin",
	"vice_mayor",
	"head_admin",
	"admin_staff",
	"legislative_staff",
	"ovm_staff",
	"councilor",
];

/**
 * Feature-based role permissions
 *
 * Permission Mapping:
 * - Dashboard: Everyone (all roles can access)
 * - Document Tracker: admin_staff, head_admin, vice_mayor, legislative_staff, it_admin
 * - Caller's Slips: vice_mayor, ovm_staff, it_admin
 * - Session Management: legislative_staff, vice_mayor, it_admin
 * - Inquiry Tickets: ovm_staff, vice_mayor, it_admin
 * - Visitor & Beneficiary Hub: ovm_staff, vice_mayor, it_admin
 * - Conference Room: Everyone (all roles can access)
 * - User Management: it_admin only
 */
export const ROLE_PERMISSIONS = {
	DASHBOARD: ALL_ROLES,
	DOCUMENT_TRACKER: [
		"admin_staff",
		"head_admin",
		"vice_mayor",
		"legislative_staff",
		"it_admin",
	] as RoleType[],
	CALLER_SLIPS: ["vice_mayor", "ovm_staff", "it_admin"] as RoleType[],
	SESSION_MANAGEMENT: [
		"legislative_staff",
		"vice_mayor",
		"it_admin",
	] as RoleType[],
	INQUIRY_TICKETS: ["ovm_staff", "vice_mayor", "it_admin"] as RoleType[],
	VISITOR_BENEFICIARY_HUB: [
		"ovm_staff",
		"vice_mayor",
		"it_admin",
	] as RoleType[],
	CONFERENCE_ROOM: ALL_ROLES,
	USER_MANAGEMENT: ["it_admin"] as RoleType[],
	ROLES_MANAGEMENT: ["it_admin"] as RoleType[],
} as const;

/**
 * Check if a user role has permission for a specific feature
 * @param role - The user's role
 * @param feature - The feature key from ROLE_PERMISSIONS
 * @returns True if the role has permission, false otherwise
 */
export function hasPermission(
	role: RoleType | undefined,
	feature: keyof typeof ROLE_PERMISSIONS,
): boolean {
	if (!role) return false;
	return ROLE_PERMISSIONS[feature].includes(role);
}

/**
 * Get all features a role has access to
 * @param role - The user's role
 * @returns Array of feature keys the role can access
 */
export function getRoleFeatures(
	role: RoleType | undefined,
): (keyof typeof ROLE_PERMISSIONS)[] {
	if (!role) return [];
	return (
		Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]
	).filter((feature) => ROLE_PERMISSIONS[feature].includes(role));
}
