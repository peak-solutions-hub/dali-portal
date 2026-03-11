import { Controller } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import { ScholarshipApplicationService } from "./scholarship-application.service";

@Controller()
export class ScholarshipApplicationController {
	constructor(
		private readonly scholarshipApplicationService: ScholarshipApplicationService,
	) {}

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.VISITOR_BENEFICIARY_HUB)
	@Implement(contract.scholarshipApplications.create)
	create() {
		return implement(contract.scholarshipApplications.create).handler(
			async ({ input }) => {
				return await this.scholarshipApplicationService.create(input);
			},
		);
	}
}
