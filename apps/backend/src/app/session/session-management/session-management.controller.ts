import { Controller, UseGuards } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import { RolesGuard } from "@/app/auth/guards/roles.guard";
import { SessionManagementService } from "./session-management.service";

// Resolves to: ["head_admin", "legislative_staff", "vice_mayor"]
// Kept as a const so changes to ROLE_PERMISSIONS propagate here automatically.
const SESSION_ROLES = ROLE_PERMISSIONS.SESSION_MANAGEMENT;

/**
 * All routes in this controller require an authenticated user whose role is
 * one of SESSION_ROLES (head_admin | legislative_staff | vice_mayor).
 *
 * RolesGuard handles both JWT verification (via Supabase) and role enforcement
 * in one pass — no separate JwtAuthGuard is needed.
 */
@Controller()
@UseGuards(RolesGuard)
export class SessionManagementController {
	constructor(
		private readonly sessionManagementService: SessionManagementService,
	) {}

	/* ============================
	   Read-only Endpoints
	   ============================ */

	@SkipThrottle()
	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.approvedDocuments)
	approvedDocuments() {
		return implement(contract.sessions.approvedDocuments).handler(async () => {
			return await this.sessionManagementService.getAgendaDocuments();
		});
	}

	@SkipThrottle()
	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.adminList)
	adminList() {
		return implement(contract.sessions.adminList).handler(async ({ input }) => {
			return await this.sessionManagementService.adminFindAll(input);
		});
	}

	@SkipThrottle()
	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.adminGetById)
	adminGetById() {
		return implement(contract.sessions.adminGetById).handler(
			async ({ input }) => {
				return await this.sessionManagementService.adminFindOne(input);
			},
		);
	}

	@Throttle({
		short: { limit: 5, ttl: 1000 },
		default: { limit: 60, ttl: 60000 },
	})
	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.getDocumentFileUrl)
	getDocumentFileUrl() {
		return implement(contract.sessions.getDocumentFileUrl).handler(
			async ({ input }) => {
				return await this.sessionManagementService.getDocumentFileUrl(input);
			},
		);
	}

	/* ============================
	   Mutating Endpoints
	   ============================ */

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.create)
	create() {
		return implement(contract.sessions.create).handler(async ({ input }) => {
			return await this.sessionManagementService.create(input);
		});
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.saveDraft)
	saveDraft() {
		return implement(contract.sessions.saveDraft).handler(async ({ input }) => {
			return await this.sessionManagementService.saveDraft(input);
		});
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.publish)
	publish() {
		return implement(contract.sessions.publish).handler(async ({ input }) => {
			return await this.sessionManagementService.publish(input);
		});
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.unpublish)
	unpublish() {
		return implement(contract.sessions.unpublish).handler(async ({ input }) => {
			return await this.sessionManagementService.unpublish(input);
		});
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.markComplete)
	markComplete() {
		return implement(contract.sessions.markComplete).handler(
			async ({ input }) => {
				return await this.sessionManagementService.markComplete(input);
			},
		);
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.delete)
	delete() {
		return implement(contract.sessions.delete).handler(async ({ input }) => {
			return await this.sessionManagementService.delete(input);
		});
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.getAgendaUploadUrl)
	getAgendaUploadUrl() {
		return implement(contract.sessions.getAgendaUploadUrl).handler(
			async ({ input }) => {
				return await this.sessionManagementService.getAgendaUploadUrl(input);
			},
		);
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.saveAgendaPdf)
	saveAgendaPdf() {
		return implement(contract.sessions.saveAgendaPdf).handler(
			async ({ input }) => {
				return await this.sessionManagementService.saveAgendaPdf(input);
			},
		);
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.removeAgendaPdf)
	removeAgendaPdf() {
		return implement(contract.sessions.removeAgendaPdf).handler(
			async ({ input }) => {
				return await this.sessionManagementService.removeAgendaPdf(input);
			},
		);
	}

	@Roles(...SESSION_ROLES)
	@Implement(contract.sessions.removeAgendaItem)
	removeAgendaItem() {
		return implement(contract.sessions.removeAgendaItem).handler(
			async ({ input }) => {
				return await this.sessionManagementService.removeAgendaItem(input);
			},
		);
	}
}
