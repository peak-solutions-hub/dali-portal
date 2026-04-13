import { Controller } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { AppError, contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import type { ORPCContext } from "@/app/types";
import { VisitorLogService } from "./visitor-log.service";

@Controller()
export class VisitorLogController {
	constructor(private readonly visitorLogService: VisitorLogService) {}

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.VISITOR_BENEFICIARY_HUB)
	@Implement(contract.visitorLogs.create)
	create() {
		return implement(contract.visitorLogs.create).handler(async ({ input }) => {
			return await this.visitorLogService.create(input);
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.VISITOR_BENEFICIARY_HUB)
	@Implement(contract.visitorLogs.list)
	list() {
		return implement(contract.visitorLogs.list).handler(async ({ context }) => {
			const { request } = context as ORPCContext;
			const authUser = request.user;

			if (!authUser) {
				throw new AppError("USER.NOT_AUTHENTICATED");
			}

			return await this.visitorLogService.list(
				authUser.role,
				authUser.fullName,
			);
		});
	}
}
