import { Controller } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { SessionManagementService } from "./session-management.service";

@Controller()
export class SessionManagementController {
	constructor(
		private readonly sessionManagementService: SessionManagementService,
	) {}

	@SkipThrottle()
	@Implement(contract.sessions.approvedDocuments)
	approvedDocuments() {
		return implement(contract.sessions.approvedDocuments).handler(async () => {
			return await this.sessionManagementService.getApprovedDocuments();
		});
	}

	@SkipThrottle()
	@Implement(contract.sessions.adminList)
	adminList() {
		return implement(contract.sessions.adminList).handler(async ({ input }) => {
			return await this.sessionManagementService.adminFindAll(input);
		});
	}

	@SkipThrottle()
	@Implement(contract.sessions.adminGetById)
	adminGetById() {
		return implement(contract.sessions.adminGetById).handler(
			async ({ input }) => {
				return await this.sessionManagementService.adminFindOne(input);
			},
		);
	}

	@Implement(contract.sessions.create)
	create() {
		return implement(contract.sessions.create).handler(async ({ input }) => {
			return await this.sessionManagementService.create(input);
		});
	}

	@Implement(contract.sessions.saveDraft)
	saveDraft() {
		return implement(contract.sessions.saveDraft).handler(async ({ input }) => {
			return await this.sessionManagementService.saveDraft(input);
		});
	}

	@Implement(contract.sessions.publish)
	publish() {
		return implement(contract.sessions.publish).handler(async ({ input }) => {
			return await this.sessionManagementService.publish(input);
		});
	}

	@Implement(contract.sessions.unpublish)
	unpublish() {
		return implement(contract.sessions.unpublish).handler(async ({ input }) => {
			return await this.sessionManagementService.unpublish(input);
		});
	}

	@Implement(contract.sessions.markComplete)
	markComplete() {
		return implement(contract.sessions.markComplete).handler(
			async ({ input }) => {
				return await this.sessionManagementService.markComplete(input);
			},
		);
	}

	@Implement(contract.sessions.delete)
	delete() {
		return implement(contract.sessions.delete).handler(async ({ input }) => {
			return await this.sessionManagementService.delete(input);
		});
	}

	@SkipThrottle()
	@Implement(contract.sessions.getDocumentFileUrl)
	getDocumentFileUrl() {
		return implement(contract.sessions.getDocumentFileUrl).handler(
			async ({ input }) => {
				return await this.sessionManagementService.getDocumentFileUrl(input);
			},
		);
	}

	@Implement(contract.sessions.getAgendaUploadUrl)
	getAgendaUploadUrl() {
		return implement(contract.sessions.getAgendaUploadUrl).handler(
			async ({ input }) => {
				return await this.sessionManagementService.getAgendaUploadUrl(input);
			},
		);
	}

	@Implement(contract.sessions.saveAgendaPdf)
	saveAgendaPdf() {
		return implement(contract.sessions.saveAgendaPdf).handler(
			async ({ input }) => {
				return await this.sessionManagementService.saveAgendaPdf(input);
			},
		);
	}

	@Implement(contract.sessions.removeAgendaPdf)
	removeAgendaPdf() {
		return implement(contract.sessions.removeAgendaPdf).handler(
			async ({ input }) => {
				return await this.sessionManagementService.removeAgendaPdf(input);
			},
		);
	}
}
