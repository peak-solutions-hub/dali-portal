import { Controller } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { AppError, contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import type { ORPCContext } from "@/app/types";
import { CallerSlipsService } from "./caller-slips.service";

@Controller()
@Roles(...ROLE_PERMISSIONS.CALLER_SLIPS)
export class CallerSlipsController {
	constructor(private readonly callerSlipsService: CallerSlipsService) {}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.callerSlips.getList)
	getList() {
		return implement(contract.callerSlips.getList).handler(
			async ({ input }) => {
				return await this.callerSlipsService.getList(input);
			},
		);
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.callerSlips.getById)
	getById() {
		return implement(contract.callerSlips.getById).handler(
			async ({ input }) => {
				return await this.callerSlipsService.getById(input.id);
			},
		);
	}

	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@Implement(contract.callerSlips.generate)
	generate() {
		return implement(contract.callerSlips.generate).handler(
			async ({ input, context }) => {
				const user = this.getAuthenticatedUser(context as ORPCContext);
				return await this.callerSlipsService.generate(input, user.id);
			},
		);
	}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Implement(contract.callerSlips.assignInvitation)
	assignInvitation() {
		return implement(contract.callerSlips.assignInvitation).handler(
			async ({ input }) => {
				return await this.callerSlipsService.assignInvitation(input);
			},
		);
	}

	@Roles("vice_mayor")
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Implement(contract.callerSlips.recordDecision)
	recordDecision() {
		return implement(contract.callerSlips.recordDecision).handler(
			async ({ input }) => {
				return await this.callerSlipsService.recordDecision(input);
			},
		);
	}

	@Roles("vice_mayor")
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Implement(contract.callerSlips.complete)
	complete() {
		return implement(contract.callerSlips.complete).handler(
			async ({ input }) => {
				return await this.callerSlipsService.complete(input.id);
			},
		);
	}

	private getAuthenticatedUser(context: ORPCContext) {
		const user = context.request.user;
		if (!user) {
			throw new AppError("AUTH.AUTHENTICATION_REQUIRED");
		}
		return user;
	}
}
