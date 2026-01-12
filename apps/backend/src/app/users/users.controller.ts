import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { UsersService } from "./users.service";

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
}
