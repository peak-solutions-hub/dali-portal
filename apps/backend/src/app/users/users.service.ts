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
			throw new ORPCError("NOT_FOUND", { message: "User not found" });
		}

		// If updating roleId, validate role exists and check for self-demotion
		if (updateData.roleId) {
			const newRole = await this.db.role.findUnique({
				where: { id: updateData.roleId },
			});

			if (!newRole) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Invalid role specified",
				});
			}

			// Prevent IT_ADMIN from demoting themselves
			if (
				currentUserId &&
				currentUserId === id &&
				existingUser.role.name === "it_admin" &&
				newRole.name !== "it_admin"
			) {
				throw new ORPCError("FORBIDDEN", {
					message:
						"You cannot change your own IT Admin role. Ask another IT Admin to update your role.",
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

		// Only activate if status is 'invited' or 'deactivated'
		if (existingUser.status === "active") {
			throw new ORPCError("BAD_REQUEST", {
				message: "User is already active or cannot be activated",
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

		// If user exists and is DEACTIVATED, suggest reactivation instead
		if (existingUser && existingUser.status === "deactivated") {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"This email belongs to a deactivated user. Please reactivate their account instead.",
			});
		}

		// If user exists and is ACTIVE, fail
		if (existingUser && existingUser.status === "active") {
			throw new ORPCError("BAD_REQUEST", {
				message: "User with this email already exists and is active",
			});
		}

		// If user exists and is INVITED, Proceed to re-send invite logic (fall through)
		// If user does not exist, Proceed to create logic

		const adminUrl = this.configService.get("adminUrl") as string;
		const redirectTo = `${adminUrl}/auth/confirm`;
		const supabase = this.supabaseAdmin.getClient();

		// Supabase Invite (Idempotent-ish: resends email if exists)
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

			// If the user already exists in Supabase Auth, inviteUserByEmail returns
			// an `email_exists` error. In that case we should not fail hard — instead
			// we send a password reset (recovery) email so the user can set their
			// password / complete account setup. If we already have a DB record for
			// this email, update its status to `invited`.
			const isEmailExists =
				(authError as { code?: string })?.code === "email_exists" ||
				(authError as { status?: number })?.status === 422;

			if (isEmailExists) {
				try {
					// Send password reset (recovery) email which lets the user set a password.
					const { error: resetError } =
						await supabase.auth.resetPasswordForEmail(email, {
							redirectTo,
						});

					if (resetError) {
						console.error("Failed to send password reset email:", resetError);
						throw new ORPCError("INTERNAL_SERVER_ERROR", {
							message: `Failed to send password reset email: ${resetError.message}`,
						});
					}

					// If we already have a DB user, update their status to `invited` and apply updates
					if (existingUser) {
						await this.db.user.update({
							where: { id: existingUser.id },
							data: {
								fullName,
								roleId,
								status: "invited",
							},
						});
					}

					return {
						success: true,
						message:
							"User already exists in Auth; password reset (recovery) email sent.",
						userId: existingUser?.id ?? null,
					} as InviteUserResponse;
				} catch (e: unknown) {
					console.error("Reinvite handling failed:", e);
					const errorMessage = e instanceof Error ? e.message : String(e);
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: `Failed to process existing user: ${errorMessage}`,
					});
				}
			}

			// Fallback: other auth errors should still fail loudly
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: `Failed to create/invite user in Supabase: ${authError.message}`,
			});
		}

		if (!authData.user) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "No user returned from Supabase Auth",
			});
		}

		// If user didn't exist in our DB, create them
		if (!existingUser) {
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
				// If DB create fails, try to cleanup auth user (only if it was just created)
				// Hard to know if auth user was just created or existed, but cleaner to leave auth than have inconsistent state?
				// Actually, better to delete auth user if we can't create DB record to keep consistency
				await supabase.auth.admin.deleteUser(authData.user.id);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create user in database",
				});
			}
		} else {
			// User existed (e.g. re-invite), update their info if needed
			// Update name/role in case they changed in the re-invite
			await this.db.user.update({
				where: { id: existingUser.id },
				data: {
					fullName,
					roleId,
					// Ensure status is invited
					status: "invited",
				},
			});
		}

		const emailSent = authData.user.invited_at !== null;

		return {
			success: true,
			message: emailSent
				? "Invitation email sent successfully."
				: "User processed but email might not have been sent.",
			userId: authData.user.id,
		};
	}
}
