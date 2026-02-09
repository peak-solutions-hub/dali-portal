import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	ActivateUserSchema,
	DeleteUserSchema,
	GetUserByIdSchema,
	GetUserListSchema,
	InviteUserResponseSchema,
	InviteUserSchema,
	UpdateUserSchema,
	UserListResponseSchema,
	UserWithRoleSchema,
} from "../schemas/user.schema";

export const getCurrentUserContract = oc
	.route({
		method: "GET",
		path: "/users/me",
		summary: "Get current user profile",
		description:
			"Retrieve the authenticated user's profile including their role information",
		tags: ["Users", "Auth"],
	})
	.output(UserWithRoleSchema)
	.errors({
		NOT_AUTHENTICATED: ERRORS.USER.NOT_AUTHENTICATED,
		NOT_FOUND: ERRORS.USER.NOT_FOUND,
	});

export const getUserListContract = oc
	.route({
		method: "GET",
		path: "/users",
		summary: "List users with filtering",
		description:
			"Retrieve a list of users with optional filtering by role, status, and search query",
		tags: ["Users", "Admin"],
	})
	.input(GetUserListSchema)
	.output(UserListResponseSchema)
	.errors({
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	});

export const deactivateUserContract = oc
	.route({
		method: "PATCH",
		path: "/users/deactivate/{id}",
		summary: "Deactivate user",
		description: "Deactivate a user account (soft delete by changing status)",
		tags: ["Users", "Admin"],
	})
	.input(DeleteUserSchema)
	.output(UserWithRoleSchema)
	.errors({
		NOT_FOUND: ERRORS.USER.NOT_FOUND,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	});

export const getUserByIdContract = oc
	.route({
		method: "GET",
		path: "/users/{id}",
		summary: "Get user by ID",
		description: "Retrieve a specific user by their unique identifier",
		tags: ["Users", "Admin"],
	})
	.input(GetUserByIdSchema)
	.output(UserWithRoleSchema)
	.errors({
		NOT_FOUND: ERRORS.USER.NOT_FOUND,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	});

export const updateUserContract = oc
	.route({
		method: "PATCH",
		path: "/users/{id}",
		summary: "Update user details",
		description: "Update user's full name, role, or status",
		tags: ["Users", "Admin"],
	})
	.input(UpdateUserSchema)
	.output(UserWithRoleSchema)
	.errors({
		NOT_FOUND: ERRORS.USER.NOT_FOUND,
		INVALID_ROLE: ERRORS.USER.INVALID_ROLE,
		SELF_DEMOTION: ERRORS.USER.SELF_DEMOTION,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	});

export const inviteUserContract = oc
	.route({
		method: "POST",
		path: "/users/invite",
		summary: "Invite user",
		description:
			"Invite a new user by email and send a set-password link (Admin only, requires Service Role Key)",
		tags: ["Users", "Admin"],
	})
	.input(InviteUserSchema)
	.output(InviteUserResponseSchema)
	.errors({
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
		INVALID_ROLE: ERRORS.USER.INVALID_ROLE,
		EMAIL_ALREADY_EXISTS: ERRORS.USER.EMAIL_ALREADY_EXISTS,
		DEACTIVATED_SUGGEST_REACTIVATION:
			ERRORS.USER.DEACTIVATED_SUGGEST_REACTIVATION,
		INVITE_FAILED: ERRORS.USER.INVITE_FAILED,
		DB_CREATE_FAILED: ERRORS.USER.DB_CREATE_FAILED,
	});

export const activateUserContract = oc
	.route({
		method: "PATCH",
		path: "/users/activate/{id}",
		summary: "Activate user account",
		description:
			"Activate a user account by changing status from 'invited' to 'active', or reactivate a deactivated account",
		tags: ["Users", "Auth"],
	})
	.input(ActivateUserSchema)
	.output(UserWithRoleSchema)
	.errors({
		NOT_FOUND: ERRORS.USER.NOT_FOUND,
		ALREADY_ACTIVE: ERRORS.USER.ALREADY_ACTIVE,
	});

export const userContract = {
	me: getCurrentUserContract,
	list: getUserListContract,
	deactivate: deactivateUserContract,
	activate: activateUserContract,
	getById: getUserByIdContract,
	update: updateUserContract,
	invite: inviteUserContract,
};
