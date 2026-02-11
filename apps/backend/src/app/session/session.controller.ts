import { Controller } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { SessionService } from "./session.service";

@Controller()
export class SessionController {
	constructor(private readonly sessionService: SessionService) {}

	/* ============================
	   Public Endpoints
	   ============================ */

	@SkipThrottle()
	@Implement(contract.sessions.list)
	list() {
		return implement(contract.sessions.list).handler(async ({ input }) => {
			return await this.sessionService.findAll(input);
		});
	}

	@SkipThrottle()
	@Implement(contract.sessions.getById)
	getById() {
		return implement(contract.sessions.getById).handler(async ({ input }) => {
			return await this.sessionService.findOne(input);
		});
	}

	/* ============================
	   Admin Endpoints
	   ============================ */

	@SkipThrottle()
	@Implement(contract.sessions.approvedDocuments)
	approvedDocuments() {
		return implement(contract.sessions.approvedDocuments).handler(async () => {
			return await this.sessionService.getApprovedDocuments();
		});
	}

	@SkipThrottle()
	@Implement(contract.sessions.adminList)
	adminList() {
		return implement(contract.sessions.adminList).handler(async ({ input }) => {
			return await this.sessionService.adminFindAll(input);
		});
	}

	@SkipThrottle()
	@Implement(contract.sessions.adminGetById)
	adminGetById() {
		return implement(contract.sessions.adminGetById).handler(
			async ({ input }) => {
				return await this.sessionService.adminFindOne(input);
			},
		);
	}

	@Implement(contract.sessions.create)
	create() {
		return implement(contract.sessions.create).handler(async ({ input }) => {
			return await this.sessionService.create(input);
		});
	}

	@Implement(contract.sessions.saveDraft)
	saveDraft() {
		return implement(contract.sessions.saveDraft).handler(async ({ input }) => {
			return await this.sessionService.saveDraft(input);
		});
	}

	@Implement(contract.sessions.publish)
	publish() {
		return implement(contract.sessions.publish).handler(async ({ input }) => {
			return await this.sessionService.publish(input);
		});
	}

	@Implement(contract.sessions.unpublish)
	unpublish() {
		return implement(contract.sessions.unpublish).handler(async ({ input }) => {
			return await this.sessionService.unpublish(input);
		});
	}

	@Implement(contract.sessions.markComplete)
	markComplete() {
		return implement(contract.sessions.markComplete).handler(
			async ({ input }) => {
				return await this.sessionService.markComplete(input);
			},
		);
	}

	@Implement(contract.sessions.delete)
	delete() {
		return implement(contract.sessions.delete).handler(async ({ input }) => {
			return await this.sessionService.delete(input);
		});
	}

	@SkipThrottle()
	@Implement(contract.sessions.getDocumentFileUrl)
	getDocumentFileUrl() {
		return implement(contract.sessions.getDocumentFileUrl).handler(
			async ({ input }) => {
				return await this.sessionService.getDocumentFileUrl(input);
			},
		);
	}
}
