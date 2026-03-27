import { Controller } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { SessionPortalService } from "./session-portal.service";

@Controller()
export class SessionPortalController {
	constructor(private readonly sessionPortalService: SessionPortalService) {}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.sessions.list)
	list() {
		return implement(contract.sessions.list).handler(async ({ input }) => {
			return await this.sessionPortalService.findAll(input);
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.sessions.getById)
	getById() {
		return implement(contract.sessions.getById).handler(async ({ input }) => {
			return await this.sessionPortalService.findOne(input);
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.sessions.getAgendaPdfUrl)
	getAgendaPdfUrl() {
		return implement(contract.sessions.getAgendaPdfUrl).handler(
			async ({ input }) => {
				return await this.sessionPortalService.getAgendaPdfUrl(input);
			},
		);
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.sessions.getPublicDocumentFileUrl)
	getPublicDocumentFileUrl() {
		return implement(contract.sessions.getPublicDocumentFileUrl).handler(
			async ({ input }) => {
				return await this.sessionPortalService.getPublicDocumentFileUrl(input);
			},
		);
	}
}
