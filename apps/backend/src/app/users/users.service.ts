import { Injectable } from "@nestjs/common";
import { ORPCError } from "@orpc/nest";
import type {
	GetUserListInput,
	UpdateUserInput,
	UserListResponse,
	UserWithRole,
} from "@repo/shared";
import { Prisma } from "generated/prisma/client";
import { DbService } from "@/app/db/db.service";

@Injectable()
export class UsersService {
	constructor(private readonly db: DbService) {}

	async getUsers(input: GetUserListInput): Promise<UserListResponse> {
		const { limit, cursor, roleType, status, search } = input;

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

		// Add cursor-based pagination
		if (cursor) {
			where.id = {
				gt: cursor,
			};
		}

		const users = await this.db.user.findMany({
			where,
			include: {
				role: true,
			},
			take: limit + 1, // Fetch one extra to check if there are more
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

		const hasMore = sortedUsers.length > limit;
		const userList = hasMore ? sortedUsers.slice(0, -1) : sortedUsers;
		const nextCursor = hasMore ? userList[userList.length - 1]?.id : undefined;

		return {
			users: userList as UserWithRole[],
			hasMore,
			nextCursor,
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
		// Check if user exists
		const existingUser = await this.db.user.findUnique({
			where: { id },
			include: {
				role: true,
			},
		});

		if (!existingUser) {
			throw new ORPCError("NOT_FOUND", { message: "User not found" });
		}

		if (existingUser.status === "active") {
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
}
