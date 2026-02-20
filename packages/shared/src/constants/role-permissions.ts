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
 * - Dashboard: admin_staff, head_admin, vice_mayor, legislative_staff, ovm_staff, councilor
 * - Document Tracker: admin_staff, head_admin, vice_mayor, legislative_staff
 * - Caller's Slips: vice_mayor, ovm_staff
 * - Session Management: head_admin, legislative_staff, vice_mayor
 * - Inquiry Tickets: admin_staff, head_admin, vice_mayor, ovm_staff, legislative_staff, councilor
 * - Visitor & Beneficiary Hub: ovm_staff, vice_mayor
 * - Conference Room: admin_staff, head_admin, vice_mayor, legislative_staff, ovm_staff, councilor
 * - User Management: it_admin only
 * - Roles Management: it_admin only
 */
export const ROLE_PERMISSIONS = {
	DASHBOARD: [
		"admin_staff",
		"head_admin",
		"vice_mayor",
		"legislative_staff",
		"ovm_staff",
		"councilor",
	] as RoleType[],
	DOCUMENT_TRACKER: [
		"admin_staff",
		"head_admin",
		"vice_mayor",
		"legislative_staff",
	] as RoleType[],
	CALLER_SLIPS: ["vice_mayor", "ovm_staff"] as RoleType[],
	SESSION_MANAGEMENT: [
		"head_admin",
		"legislative_staff",
		"vice_mayor",
	] as RoleType[],
	INQUIRY_TICKETS: [
		"admin_staff",
		"head_admin",
		"vice_mayor",
		"ovm_staff",
		"legislative_staff",
		"councilor",
	] as RoleType[],
	VISITOR_BENEFICIARY_HUB: ["ovm_staff", "vice_mayor"] as RoleType[],
	CONFERENCE_ROOM: [
		"admin_staff",
		"head_admin",
		"vice_mayor",
		"legislative_staff",
		"ovm_staff",
		"councilor",
	] as RoleType[],
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
