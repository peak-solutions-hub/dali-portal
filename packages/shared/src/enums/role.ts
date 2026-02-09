export const RoleType = {
	IT_ADMIN: "it_admin",
	VICE_MAYOR: "vice_mayor",
	HEAD_ADMIN: "head_admin",
	ADMIN_STAFF: "admin_staff",
	LEGISLATIVE_STAFF: "legislative_staff",
	OVM_STAFF: "ovm_staff",
	COUNCILOR: "councilor",
} as const;

export type RoleType = (typeof RoleType)[keyof typeof RoleType];
export const ROLE_TYPE_VALUES: RoleType[] = Object.values(RoleType);

// Role display name mapping
export const ROLE_DISPLAY_NAMES: Record<RoleType, string> = {
	[RoleType.IT_ADMIN]: "IT Administrator",
	[RoleType.VICE_MAYOR]: "Vice Mayor",
	[RoleType.HEAD_ADMIN]: "Head Administrator",
	[RoleType.ADMIN_STAFF]: "Administrative Staff",
	[RoleType.LEGISLATIVE_STAFF]: "Legislative Staff",
	[RoleType.OVM_STAFF]: "OVM Staff",
	[RoleType.COUNCILOR]: "Councilor",
};
