import { Controller } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import { BeneficiaryService } from "./beneficiary.service";

@Controller()
export class BeneficiaryController {
	constructor(private readonly beneficiaryService: BeneficiaryService) {}

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.VISITOR_BENEFICIARY_HUB)
	@Implement(contract.beneficiaries.list)
	list() {
		return implement(contract.beneficiaries.list).handler(async () => {
			return await this.beneficiaryService.list();
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.VISITOR_BENEFICIARY_HUB)
	@Implement(contract.beneficiaries.getById)
	getById() {
		return implement(contract.beneficiaries.getById).handler(
			async ({ input }) => {
				return await this.beneficiaryService.getById(input.id);
			},
		);
	}
}
