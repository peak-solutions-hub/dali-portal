import type { RoleType } from "../../enums";

/**
 * Get the redirect path based on user role after successful login
 *
 * @param role - The user's role type
 * @returns The path to redirect to
 */
export function getRedirectPath(role: RoleType): string {
	switch (role) {
		case "it_admin":
			return "/user-management";
		case "vice_mayor":
			return "/dashboard";
		case "head_admin":
			return "/dashboard";
		case "admin_staff":
		case "legislative_staff":
		case "ovm_staff":
			return "/dashboard";
		case "councilor":
			return "/dashboard";
		default:
			return "/dashboard";
	}
}
