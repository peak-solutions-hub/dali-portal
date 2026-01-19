import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract, RoleType } from "@repo/shared";
import { Roles } from "@/app/auth";
import { RolesService } from "./roles.service";

// Only IT_ADMIN and HEAD_ADMIN can access roles for user management
@Roles(RoleType.IT_ADMIN, RoleType.HEAD_ADMIN)
@Controller()
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	@Implement(contract.roles.list)
	getRoles() {
		return implement(contract.roles.list).handler(async () => {
			return await this.rolesService.getRoles();
		});
	}
}
