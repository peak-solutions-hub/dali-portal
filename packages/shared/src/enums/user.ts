export const UserStatus = {
	ACTIVE: "active",
	INVITED: "invited",
	DEACTIVATED: "deactivated",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export const USER_STATUS_VALUES: UserStatus[] = Object.values(UserStatus);
