import { oc } from "@orpc/contract";
import {
	DeleteUserSchema,
	GetUserByIdSchema,
	GetUserListSchema,
	UpdateUserSchema,
	UserListResponseSchema,
	UserWithRoleSchema,
} from "../schemas/user.schema";

// Get users list
export const getUserListContract = oc
	.route({
		method: "GET",
		path: "/users",
		summary: "List users with filtering",
		description:
			"Retrieve a paginated list of users with optional filtering by role, status, and search query",
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

// Export user contract
export const userContract = {
	list: getUserListContract,
	deactivate: deactivateUserContract,
	getById: getUserByIdContract,
	update: updateUserContract,
};
