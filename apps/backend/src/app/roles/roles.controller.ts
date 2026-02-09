import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import { RolesService } from "./roles.service";

// Only IT_ADMIN can access roles for user management
@Roles(...ROLE_PERMISSIONS.ROLES_MANAGEMENT)
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
