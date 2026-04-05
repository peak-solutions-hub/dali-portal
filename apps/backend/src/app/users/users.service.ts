import { Injectable, Logger } from "@nestjs/common";
import type {
	ActivateUserInput,
	AssignableUserListResponse,
	CheckEmailStatusInput,
	CheckEmailStatusResponse,
	GetAssignableUsersInput,
	GetUserListInput,
	InviteUserInput,
	InviteUserResponse,
	RequestPasswordResetInput,
	RequestPasswordResetResponse,
	RoleType,
	UpdateUserInput,
	UserListResponse,
	UserWithRole,
} from "@repo/shared";
import { AppError, INQUIRY_ASSIGNABLE_ROLES } from "@repo/shared";
import { Prisma } from "generated/prisma/client";
import { RolesGuard } from "@/app/auth/guards/roles.guard";
import { DbService } from "@/app/db/db.service";
import { SupabaseAdminService } from "@/app/util/supabase/supabase-admin.service";
import { ConfigService } from "@/lib/config.service";

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name);

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

	async getAssignableUsers(
		input: GetAssignableUsersInput,
	): Promise<AssignableUserListResponse> {
		const requestedRoles = input.roles;
		let allowedRoles: RoleType[] = [...INQUIRY_ASSIGNABLE_ROLES];

		if (requestedRoles && requestedRoles.length > 0) {
			allowedRoles = requestedRoles.filter((role) =>
				INQUIRY_ASSIGNABLE_ROLES.includes(role),
			);
		}

		if (allowedRoles.length === 0) {
			return { users: [] };
		}

		const users = await this.db.user.findMany({
			where: {
				status: "active",
				role: {
					name: {
						in: allowedRoles,
					},
				},
				...(input.search
					? {
							fullName: {
								contains: input.search,
								mode: "insensitive",
							},
						}
					: {}),
			},
			select: {
				id: true,
				fullName: true,
				role: {
					select: {
						name: true,
					},
				},
			},
			orderBy: [{ role: { name: "asc" } }, { fullName: "asc" }],
		});

		return {
			users: users.map((user) => ({
				id: user.id,
				fullName: user.fullName,
				role: user.role.name,
			})),
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
			throw new AppError("USER.NOT_FOUND");
		}

		return user as UserWithRole;
	}

	async updateUser(
		input: UpdateUserInput,
		currentUserId?: string,
	): Promise<UserWithRole> {
		const { id, ...updateData } = input;

		// Check if user exists
		const existingUser = await this.db.user.findUnique({
			where: { id },
			include: { role: true },
		});

		if (!existingUser) {
			throw new AppError("USER.NOT_FOUND");
		}

		// If updating roleId, validate role exists and check for self-demotion
		if (updateData.roleId) {
			const newRole = await this.db.role.findUnique({
				where: { id: updateData.roleId },
			});

			if (!newRole) {
				throw new AppError("USER.INVALID_ROLE");
			}

			// Prevent IT_ADMIN from demoting themselves
			if (
				currentUserId &&
				currentUserId === id &&
				existingUser.role.name === "it_admin" &&
				newRole.name !== "it_admin"
			) {
				throw new AppError("USER.SELF_DEMOTION");
			}
		}

		const updatedUser = await this.db.user.update({
			where: { id },
			data: updateData,
			include: {
				role: true,
			},
		});

		// Invalidate user cache to ensure role/status changes take effect immediately
		RolesGuard.invalidateUserCache(id);

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
			throw new AppError("USER.NOT_FOUND");
		}

		// If the user isn't already deactivated, mark them as deactivated in the DB.
		if (existingUser.status !== "deactivated") {
			const deactivatedUser = await this.db.user.update({
				where: { id },
				data: {
					status: "deactivated",
				},
				include: {
					role: true,
				},
			});

			// Invalidate user cache to ensure status change takes effect immediately
			RolesGuard.invalidateUserCache(id);

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
			throw new AppError("USER.NOT_FOUND");
		}

		// Only activate if status is 'invited' or 'deactivated'
		if (existingUser.status === "active") {
			throw new AppError("USER.ALREADY_ACTIVE");
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

		// Invalidate user cache to ensure status change takes effect immediately
		RolesGuard.invalidateUserCache(id);

		return activatedUser as UserWithRole;
	}

	async checkEmailStatus(
		input: CheckEmailStatusInput,
	): Promise<CheckEmailStatusResponse> {
		const { email } = input;

		const user = await this.db.user.findFirst({
			where: { email },
		});

		if (!user) {
			return {
				exists: false,
				isDeactivated: false,
			};
		}

		return {
			exists: true,
			isDeactivated: user.status === "deactivated",
		};
	}

	async inviteUser(input: InviteUserInput): Promise<InviteUserResponse> {
		const { email, fullName, roleId } = input;

		const role = await this.db.role.findUnique({
			where: { id: roleId },
		});

		if (!role) {
			throw new AppError("USER.INVALID_ROLE");
		}

		const existingUser = await this.db.user.findFirst({
			where: { email },
		});

		// If user exists and is DEACTIVATED, suggest reactivation instead
		if (existingUser && existingUser.status === "deactivated") {
			throw new AppError("USER.DEACTIVATED_SUGGEST_REACTIVATION");
		}

		// If user exists and is ACTIVE, fail
		if (existingUser && existingUser.status === "active") {
			throw new AppError("USER.EMAIL_ALREADY_EXISTS");
		}

		// If user exists and is INVITED, Proceed to re-send invite logic (fall through)
		// If user does not exist, Proceed to create logic

		const redirectTo = `${this.configService.getOrThrow("adminUrl")}/auth/confirm`;
		const supabase = this.supabaseAdmin.getClient();

		// For reinvites (user exists with "invited" status), delete only the old
		// Supabase auth user so inviteUserByEmail can create a fresh one.
		// We keep the DB record and update it with the new auth user ID to avoid
		// foreign key constraint violations from related tables.
		const isReinvite = !!existingUser && existingUser.status === "invited";

		if (isReinvite) {
			this.logger.log(
				`Reinviting user ${email}: deleting old auth user (keeping DB record)`,
			);
			try {
				await supabase.auth.admin.deleteUser(existingUser.id);
			} catch (e) {
				this.logger.warn(`Failed to delete old auth user for reinvite: ${e}`);
				// Continue — auth user may not exist or was already cleaned up
			}
			RolesGuard.invalidateUserCache(existingUser.id);
		}

		// Supabase Invite — creates auth user and sends invite email
		const { data: authData, error: authError } =
			await supabase.auth.admin.inviteUserByEmail(email, {
				redirectTo,
				data: {
					full_name: fullName,
					role_id: roleId,
				},
			});

		if (authError) {
			this.logger.error("Supabase Auth Error:", authError);
			throw new AppError("USER.INVITE_FAILED", authError.message);
		}

		if (!authData.user) {
			throw new AppError("USER.INVITE_FAILED");
		}

		// For reinvites, update the existing DB record with the new auth user ID.
		// For fresh invites, create a new DB record.
		try {
			if (isReinvite && existingUser) {
				await this.db.user.update({
					where: { id: existingUser.id },
					data: {
						id: authData.user.id,
						roleId,
						fullName,
						status: "invited",
					},
					include: {
						role: true,
					},
				});

				this.logger.log(
					`Reinvite: updated DB user ${existingUser.id} → ${authData.user.id}`,
				);
			} else {
				await this.db.user.create({
					data: {
						id: authData.user.id,
						roleId,
						fullName,
						email,
						status: "invited",
					},
					include: {
						role: true,
					},
				});

				this.logger.log(`User created in database: ${authData.user.id}`);
			}
		} catch (dbError) {
			this.logger.error("Database Error:", dbError);
			// Delete auth user to keep consistency if DB create fails
			await supabase.auth.admin.deleteUser(authData.user.id);
			throw new AppError("USER.DB_CREATE_FAILED");
		}

		return {
			success: true,
			message: isReinvite
				? "Reinvitation email sent successfully."
				: "Invitation email sent successfully.",
			userId: authData.user.id,
		};
	}

	async requestPasswordReset(
		input: RequestPasswordResetInput,
	): Promise<RequestPasswordResetResponse> {
		const { email } = input;

		const user = await this.db.user.findFirst({
			where: { email },
			select: { status: true },
		});

		if (user?.status === "deactivated") {
			throw new AppError(
				"AUTH.DEACTIVATED_ACCOUNT",
				"Your account has been deactivated. Please contact an administrator.",
			);
		}

		// To prevent user enumeration, we return success true even if user doesn't exist
		if (!user) {
			this.logger.warn(
				`Password reset requested for non-existent user: ${email}`,
			);
			return { success: true };
		}

		const supabase = this.supabaseAdmin.getClient();
		const adminUrl = this.configService.get("adminUrl") as string;
		const redirectTo = `${adminUrl}/auth/callback?next=/set-password`;

		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo,
		});

		if (error) {
			this.logger.error(`Error requesting password reset for ${email}:`, error);
			throw new AppError(
				"GENERAL.INTERNAL_SERVER_ERROR",
				"Failed to send password reset email.",
			);
		}

		return { success: true };
	}
}
