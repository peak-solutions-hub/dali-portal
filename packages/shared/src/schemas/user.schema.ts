import { z } from "zod";
import { RoleTypeSchema } from "../enums/role";
import { USER_STATUS_VALUES, UserStatus } from "../enums/user";

// Base User schema matching Prisma model
export const UserSchema = z.object({
	id: z.uuid(),
	roleId: z.uuid(),
	fullName: z.string().min(1).max(255),
	email: z.email(),
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
	limit: z.coerce.number().int().min(1).max(100).default(20),
	cursor: z.string().uuid().optional(),
	roleType: RoleTypeSchema.optional(),
	status: z.enum(USER_STATUS_VALUES).optional(),
	search: z.string().optional(),
});

export const GetUserByIdSchema = z.object({
	id: z.uuid(),
});

export const UpdateUserSchema = z.object({
	id: z.uuid(),
	fullName: z.string().min(1).max(255).optional(),
	roleId: z.uuid().optional(),
	status: z.enum(USER_STATUS_VALUES).optional(),
});

export const DeleteUserSchema = z.object({
	id: z.uuid(),
});

export const InviteUserSchema = z.object({
	email: z.email(),
	fullName: z.string().min(1).max(255),
	roleId: z.uuid(),
});

// Response schemas
export const UserListResponseSchema = z.object({
	users: z.array(UserWithRoleSchema),
	hasMore: z.boolean(),
	nextCursor: z.string().uuid().optional(),
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
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type InviteUserResponse = z.infer<typeof InviteUserResponseSchema>;
