import { Controller } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import { AssistanceRecordService } from "./assistance-record.service";

@Controller()
export class AssistanceRecordController {
	constructor(
		private readonly assistanceRecordService: AssistanceRecordService,
	) {}

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.VISITOR_BENEFICIARY_HUB)
	@Implement(contract.assistanceRecords.create)
	create() {
		return implement(contract.assistanceRecords.create).handler(
			async ({ input }) => {
				return await this.assistanceRecordService.create(input);
			},
		);
	}

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.VISITOR_BENEFICIARY_HUB)
	@Implement(contract.assistanceRecords.checkDuplicatePerson)
	checkDuplicatePerson() {
		return implement(contract.assistanceRecords.checkDuplicatePerson).handler(
			async ({ input }) => {
				return await this.assistanceRecordService.checkDuplicatePerson(input);
			},
		);
	}
}
