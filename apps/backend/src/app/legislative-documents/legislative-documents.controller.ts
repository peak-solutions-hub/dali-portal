import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { AppError, contract } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import type { ORPCContext } from "@/app/types";
import { LegislativeDocumentsService } from "./legislative-documents.service";

@Controller()
export class LegislativeDocumentsController {
	constructor(
		private readonly legislativeDocumentsService: LegislativeDocumentsService,
	) {}

	// Public endpoint - citizens can view legislative documents
	@Implement(contract.legislativeDocuments.list)
	list() {
		return implement(contract.legislativeDocuments.list).handler(
			async ({ input }) => {
				return await this.legislativeDocumentsService.findAll(input);
			},
		);
	}

	// Public endpoint - citizens can view statistics
	@Implement(contract.legislativeDocuments.statistics)
	statistics() {
		return implement(contract.legislativeDocuments.statistics).handler(
			async () => {
				return await this.legislativeDocumentsService.getStatistics();
			},
		);
	}

	// Public endpoint - citizens can view latest documents
	@Implement(contract.legislativeDocuments.latest)
	latest() {
		return implement(contract.legislativeDocuments.latest).handler(
			async ({ input }) => {
				return await this.legislativeDocumentsService.getLatestDocuments(
					input.limit,
				);
			},
		);
	}

	// Public endpoint - citizens can view document details
	@Implement(contract.legislativeDocuments.getById)
	getById() {
		return implement(contract.legislativeDocuments.getById).handler(
			async ({ input }) => {
				return await this.legislativeDocumentsService.findOne(input.id);
			},
		);
	}

	@Roles("head_admin", "legislative_staff")
	@Implement(contract.legislativeDocuments.publish)
	publish() {
		return implement(contract.legislativeDocuments.publish).handler(
			async ({ input, context }) => {
				const user = this.getAuthenticatedUser(context as ORPCContext);
				return await this.legislativeDocumentsService.publish(input, user.id);
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
