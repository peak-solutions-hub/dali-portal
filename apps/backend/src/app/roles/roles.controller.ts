import { Controller, UseGuards } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import { RolesGuard } from "@/app/auth/guards/roles.guard";
import { RolesService } from "./roles.service";

@Controller()
@UseGuards(RolesGuard)
export class RolesController {
	constructor(private readonly rolesService: RolesService) {}

	// Only IT_ADMIN can access roles for user management
	@Roles(...ROLE_PERMISSIONS.ROLES_MANAGEMENT)
	@Implement(contract.roles.list)
	getRoles() {
		return implement(contract.roles.list).handler(async () => {
			return await this.rolesService.getRoles();
		});
	}
}
