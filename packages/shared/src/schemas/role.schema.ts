import { z } from "zod";

export const RoleTypeSchema = z.enum([
	"it_admin",
	"vice_mayor",
	"head_admin",
	"admin_staff",
	"legislative_staff",
	"ovm_staff",
	"councilor",
]);

// Role schema matching Prisma model
export const RoleSchema = z.object({
	id: z.uuid(),
	name: RoleTypeSchema,
	createdAt: z.date(),
});

// Response schema
export const RoleListResponseSchema = z.object({
	roles: z.array(RoleSchema),
});

// Types
export type Role = z.infer<typeof RoleSchema>;
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>;
