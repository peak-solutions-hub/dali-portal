import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { RolesService } from "./roles.service";

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
