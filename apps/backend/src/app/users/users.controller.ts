import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth";
import type { ORPCContext } from "@/app/types";
import { UsersService } from "./users.service";

@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	// Get current authenticated user's profile - accessible by any authenticated user
	@Implement(contract.users.me)
	getCurrentUser() {
		return implement(contract.users.me).handler(async ({ context }) => {
			// Extract user from request (set by JwtAuthGuard via SupabaseJwtStrategy)
			const { request } = context as ORPCContext;
			const authUser = request.user;

			if (!authUser) {
				throw new Error("User not authenticated");
			}

			return await this.usersService.getUserById(authUser.id);
		});
	}

	// User management routes require IT_ADMIN role
	@Roles(...ROLE_PERMISSIONS.USER_MANAGEMENT)
	@Implement(contract.users.list)
	getUsers() {
		return implement(contract.users.list).handler(async ({ input }) => {
			return await this.usersService.getUsers(input);
		});
	}

	@Roles(...ROLE_PERMISSIONS.USER_MANAGEMENT)
	@Implement(contract.users.deactivate)
	deactivateUser() {
		return implement(contract.users.deactivate).handler(async ({ input }) => {
			return await this.usersService.deactivateUser(input.id);
		});
	}

	@Implement(contract.users.activate)
	activateUser() {
		return implement(contract.users.activate).handler(async ({ input }) => {
			return await this.usersService.activateUser(input);
		});
	}

	@Roles(...ROLE_PERMISSIONS.USER_MANAGEMENT)
	@Implement(contract.users.getById)
	getUserById() {
		return implement(contract.users.getById).handler(async ({ input }) => {
			return await this.usersService.getUserById(input.id);
		});
	}

	@Roles(...ROLE_PERMISSIONS.USER_MANAGEMENT)
	@Implement(contract.users.update)
	updateUser() {
		return implement(contract.users.update).handler(async ({ input }) => {
			return await this.usersService.updateUser(input);
		});
	}

	@Roles(...ROLE_PERMISSIONS.USER_MANAGEMENT)
	@Implement(contract.users.invite)
	inviteUser() {
		return implement(contract.users.invite).handler(async ({ input }) => {
			return await this.usersService.inviteUser(input);
		});
	}
}
