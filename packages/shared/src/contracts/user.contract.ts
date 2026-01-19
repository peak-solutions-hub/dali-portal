import { oc } from "@orpc/contract";
import {
	DeleteUserSchema,
	GetUserByIdSchema,
	GetUserListSchema,
	InviteUserResponseSchema,
	InviteUserSchema,
	UpdateUserSchema,
	UserListResponseSchema,
	UserWithRoleSchema,
} from "../schemas/user.schema";

// Get current user profile (authenticated user)
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
		UNAUTHORIZED: {
			message: "User not authenticated",
		},
		NOT_FOUND: {
			message: "User profile not found",
		},
	});

// Get users list
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
		UNAUTHORIZED: {
			message: "User not authorized to access users",
		},
		BAD_REQUEST: {
			message: "Invalid query parameters",
		},
	});

// Deactivate user
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
		NOT_FOUND: {
			message: "User not found",
		},
		UNAUTHORIZED: {
			message: "User not authorized to deactivate users",
		},
		BAD_REQUEST: {
			message: "Cannot deactivate this user",
		},
	});

// Get user by ID
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
		NOT_FOUND: {
			message: "User not found",
		},
		UNAUTHORIZED: {
			message: "User not authorized to access user details",
		},
	});

// Update user
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
		NOT_FOUND: {
			message: "User not found",
		},
		UNAUTHORIZED: {
			message: "User not authorized to update users",
		},
		BAD_REQUEST: {
			message: "Invalid update data",
		},
	});

// Invite user
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
		UNAUTHORIZED: {
			message: "User not authorized to invite users",
		},
		BAD_REQUEST: {
			message: "Invalid invite data or email already exists",
		},
		INTERNAL_SERVER_ERROR: {
			message: "Failed to send invitation email",
		},
	});

// Export user contract
export const userContract = {
	me: getCurrentUserContract,
	list: getUserListContract,
	deactivate: deactivateUserContract,
	getById: getUserByIdContract,
	update: updateUserContract,
	invite: inviteUserContract,
};
