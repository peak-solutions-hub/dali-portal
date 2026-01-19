import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract, RoleType } from "@repo/shared";
import { Roles } from "@/app/auth";
import { UsersService } from "./users.service";

// All user management routes require IT_ADMIN or HEAD_ADMIN role
@Roles(RoleType.IT_ADMIN, RoleType.HEAD_ADMIN)
@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Implement(contract.users.list)
	getUsers() {
		return implement(contract.users.list).handler(async ({ input }) => {
			return await this.usersService.getUsers(input);
		});
	}

	@Implement(contract.users.deactivate)
	deactivateUser() {
		return implement(contract.users.deactivate).handler(async ({ input }) => {
			return await this.usersService.deactivateUser(input.id);
		});
	}

	@Implement(contract.users.getById)
	getUserById() {
		return implement(contract.users.getById).handler(async ({ input }) => {
			return await this.usersService.getUserById(input.id);
		});
	}

	@Implement(contract.users.update)
	updateUser() {
		return implement(contract.users.update).handler(async ({ input }) => {
			return await this.usersService.updateUser(input);
		});
	}

	@Implement(contract.users.invite)
	inviteUser() {
		return implement(contract.users.invite).handler(async ({ input }) => {
			return await this.usersService.inviteUser(input);
		});
	}
}
