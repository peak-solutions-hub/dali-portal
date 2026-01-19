import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { Public } from "@/app/auth";
import { LegislativeDocumentsService } from "./legislative-documents.service";

// All legislative document routes are public (citizen-facing portal)
@Public()
@Controller()
export class LegislativeDocumentsController {
	constructor(
		private readonly legislativeDocumentsService: LegislativeDocumentsService,
	) {}

	@Implement(contract.legislativeDocuments.list)
	list() {
		return implement(contract.legislativeDocuments.list).handler(
			async ({ input }) => {
				return await this.legislativeDocumentsService.findAll(input);
			},
		);
	}

	@Implement(contract.legislativeDocuments.statistics)
	statistics() {
		return implement(contract.legislativeDocuments.statistics).handler(
			async () => {
				return await this.legislativeDocumentsService.getStatistics();
			},
		);
	}

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

	@Implement(contract.legislativeDocuments.getById)
	getById() {
		return implement(contract.legislativeDocuments.getById).handler(
			async ({ input }) => {
				return await this.legislativeDocumentsService.findOne(input.id);
			},
		);
	}
}
