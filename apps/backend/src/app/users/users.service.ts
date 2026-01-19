import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import type {
	ActivateUserInput,
	GetUserListInput,
	InviteUserInput,
	InviteUserResponse,
	UpdateUserInput,
	UserListResponse,
	UserWithRole,
} from "@repo/shared";
import { Prisma } from "generated/prisma/client";
import { DbService } from "@/app/db/db.service";
import { SupabaseAdminService } from "@/app/util/supabase/supabase-admin.service";
import { ConfigService } from "@/lib/config.service";

@Injectable()
export class UsersService {
	constructor(
		private readonly db: DbService,
		private readonly supabaseAdmin: SupabaseAdminService,
		private readonly configService: ConfigService,
	) {}

	async getUsers(input: GetUserListInput): Promise<UserListResponse> {
		const { roleType, status, search } = input;

		// Build where clause
		const where: Prisma.UserWhereInput = {};

		if (status) {
			where.status = status;
		}

		if (roleType) {
			where.role = {
				name: roleType,
			};
		}

		if (search) {
			where.OR = [
				{
					fullName: {
						contains: search,
						mode: "insensitive",
					},
				},
				{
					email: {
						contains: search,
						mode: "insensitive",
					},
				},
			];
		}

		const users = await this.db.user.findMany({
			where,
			include: {
				role: true,
			},
		});

		// Sort users by status priority, then by role enum order
		const sortedUsers = users.sort((a, b) => {
			const statusOrder = { invited: 0, active: 1, deactivated: 2 };
			const statusA = statusOrder[a.status] ?? 999;
			const statusB = statusOrder[b.status] ?? 999;

			// First sort by status
			if (statusA !== statusB) {
				return statusA - statusB;
			}

			// Then sort by role enum order
			const roleOrder = {
				it_admin: 0,
				vice_mayor: 1,
				head_admin: 2,
				admin_staff: 3,
				legislative_staff: 4,
				ovm_staff: 5,
				councilor: 6,
			};
			const roleA = roleOrder[a.role.name] ?? 999;
			const roleB = roleOrder[b.role.name] ?? 999;
			return roleA - roleB;
		});

		return {
			users: sortedUsers as UserWithRole[],
		};
	}

	async getUserById(id: string): Promise<UserWithRole> {
		const user = await this.db.user.findUnique({
			where: { id },
			include: {
				role: true,
			},
		});

		if (!user) {
			throw new ORPCError("NOT_FOUND", { message: "User not found" });
		}

		return user as UserWithRole;
	}

	async updateUser(input: UpdateUserInput): Promise<UserWithRole> {
		const { id, ...updateData } = input;

		// Check if user exists
		const existingUser = await this.db.user.findUnique({
			where: { id },
		});

		if (!existingUser) {
			throw new ORPCError("NOT_FOUND", { message: "User not found" });
		}

		// If updating roleId, validate role exists
		if (updateData.roleId) {
			const role = await this.db.role.findUnique({
				where: { id: updateData.roleId },
			});

			if (!role) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Invalid role specified",
				});
			}
		}

		const updatedUser = await this.db.user.update({
			where: { id },
			data: updateData,
			include: {
				role: true,
			},
		});

		return updatedUser as UserWithRole;
	}

	async deactivateUser(id: string): Promise<UserWithRole> {
		const existingUser = await this.db.user.findUnique({
			where: { id },
			include: {
				role: true,
			},
		});

		if (!existingUser) {
			throw new ORPCError("NOT_FOUND", { message: "User not found" });
		}

		if (existingUser.status === "active" || existingUser.status === "invited") {
			const deactivatedUser = await this.db.user.update({
				where: { id },
				data: {
					status: "deactivated",
				},
				include: {
					role: true,
				},
			});

			return deactivatedUser as UserWithRole;
		}

		return existingUser as UserWithRole;
	}

	async activateUser(input: ActivateUserInput): Promise<UserWithRole> {
		const { id } = input;

		const existingUser = await this.db.user.findUnique({
			where: { id },
			include: {
				role: true,
			},
		});

		if (!existingUser) {
			throw new ORPCError("NOT_FOUND", { message: "User not found" });
		}

		// Only activate if status is 'invited'
		if (existingUser.status !== "invited") {
			throw new ORPCError("BAD_REQUEST", {
				message: "User is not in invited status",
			});
		}

		const activatedUser = await this.db.user.update({
			where: { id },
			data: {
				status: "active",
			},
			include: {
				role: true,
			},
		});

		return activatedUser as UserWithRole;
	}

	async inviteUser(input: InviteUserInput): Promise<InviteUserResponse> {
		const { email, fullName, roleId } = input;

		const role = await this.db.role.findUnique({
			where: { id: roleId },
		});

		if (!role) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Invalid role specified",
			});
		}

		const existingUser = await this.db.user.findFirst({
			where: { email },
		});

		if (existingUser) {
			throw new ORPCError("BAD_REQUEST", {
				message: "User with this email already exists",
			});
		}

		const adminUrl = this.configService.get("adminUrl") as string;
		// CRITICAL: Use callback route to properly exchange code for session
		// The 'next' param tells the callback where to redirect after session is set
		const redirectTo = `${adminUrl}/auth/callback?next=/auth/set-password`;
		const supabase = this.supabaseAdmin.getClient();

		const { data: authData, error: authError } =
			await supabase.auth.admin.inviteUserByEmail(email, {
				redirectTo,
				data: {
					full_name: fullName,
					role_id: roleId,
				},
			});

		if (authError) {
			console.error("Supabase Auth Error:", authError);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: `Failed to create user in Supabase: ${authError.message}`,
			});
		}

		if (!authData.user) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "No user returned from Supabase Auth",
			});
		}

		try {
			const newUser = await this.db.user.create({
				data: {
					id: authData.user.id,
					roleId: roleId,
					fullName: fullName,
					email: email,
					status: "invited",
				},
				include: {
					role: true,
				},
			});

			console.log("✓ User created in database:", newUser.id);
		} catch (dbError) {
			console.error("Database Error:", dbError);
			await supabase.auth.admin.deleteUser(authData.user.id);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Failed to create user in database",
			});
		}

		const emailSent = authData.user.invited_at !== null;

		return {
			success: true,
			message: emailSent
				? "User invited successfully. Invitation email sent."
				: "User created but email NOT sent. Check Supabase email settings.",
			userId: authData.user.id,
		};
	}
}
