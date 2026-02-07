import { z } from "zod";
import { TEXT_LIMITS } from "../constants";
import { USER_STATUS_VALUES } from "../enums/user";
import { RoleTypeSchema } from "./role.schema";

// Base User schema matching Prisma model
export const UserSchema = z.object({
	id: z.uuid(),
	roleId: z.uuid(),
	fullName: z
		.string()
		.min(5, "Name must be at least 5 characters")
		.max(TEXT_LIMITS.XS, `Name must not exceed ${TEXT_LIMITS.XS} characters`),
	email: z
		.email()
		.max(TEXT_LIMITS.SM, `Email must not exceed ${TEXT_LIMITS.SM} characters`),
	createdAt: z.date(),
	status: z.enum(USER_STATUS_VALUES),
});

// Extended User schema with role relationship
export const UserWithRoleSchema = UserSchema.extend({
	role: z.object({
		id: z.uuid(),
		name: RoleTypeSchema,
		createdAt: z.date(),
	}),
});

// Input schemas for operations
export const GetUserListSchema = z.object({
	roleType: RoleTypeSchema.optional(),
	status: z.enum(USER_STATUS_VALUES).optional(),
	search: z.string().optional(),
});

export const GetUserByIdSchema = z.object({
	id: z.uuid(),
});

export const UpdateUserSchema = z.object({
	id: z.uuid(),
	fullName: z
		.string()
		.min(5, "Name must be at least 5 characters")
		.max(TEXT_LIMITS.XS, `Name must not exceed ${TEXT_LIMITS.XS} characters`)
		.optional(),
	roleId: z.uuid().optional(),
	status: z.enum(USER_STATUS_VALUES).optional(),
});

export const DeleteUserSchema = z.object({
	id: z.uuid(),
});

export const ActivateUserSchema = z.object({
	id: z.uuid(),
});

export const InviteUserSchema = z.object({
	email: z
		.email()
		.max(TEXT_LIMITS.SM, `Email must not exceed ${TEXT_LIMITS.SM} characters`),
	fullName: z
		.string()
		.min(5, "Name must be at least 5 characters")
		.max(TEXT_LIMITS.XS, `Name must not exceed ${TEXT_LIMITS.XS} characters`),
	roleId: z.uuid(),
});

// Response schemas
export const UserListResponseSchema = z.object({
	users: z.array(UserWithRoleSchema),
});

export const InviteUserResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	userId: z.string().optional(),
});

// Types
export type User = z.infer<typeof UserSchema>;
export type UserWithRole = z.infer<typeof UserWithRoleSchema>;
export type GetUserListInput = z.infer<typeof GetUserListSchema>;
export type GetUserByIdInput = z.infer<typeof GetUserByIdSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
export type ActivateUserInput = z.infer<typeof ActivateUserSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type InviteUserResponse = z.infer<typeof InviteUserResponseSchema>;
