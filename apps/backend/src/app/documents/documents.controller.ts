import { Controller } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { AppError, contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import type { ORPCContext } from "@/app/types";
import { DocumentsService } from "./documents.service";

@Controller()
@Roles(...ROLE_PERMISSIONS.DOCUMENT_TRACKER)
export class DocumentsController {
	constructor(private readonly documentsService: DocumentsService) {}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.documents.getList)
	getList() {
		return implement(contract.documents.getList).handler(async ({ input }) => {
			return await this.documentsService.getList(input);
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.documents.getById)
	getById() {
		return implement(contract.documents.getById).handler(async ({ input }) => {
			return await this.documentsService.getById(input.id);
		});
	}

	@Throttle({
		default: {
			limit: 5,
			ttl: 60000,
		},
	})
	@Implement(contract.documents.create)
	create() {
		return implement(contract.documents.create).handler(
			async ({ input, context }) => {
				const user = this.getAuthenticatedUser(context as ORPCContext);
				return await this.documentsService.create(input, user.id);
			},
		);
	}

	@Throttle({
		default: {
			limit: 10,
			ttl: 60000,
		},
	})
	@Implement(contract.documents.updateStatus)
	updateStatus() {
		return implement(contract.documents.updateStatus).handler(
			async ({ input, context }) => {
				const user = this.getAuthenticatedUser(context as ORPCContext);
				return await this.documentsService.updateStatus(
					input,
					user.id,
					user.role,
				);
			},
		);
	}

	@Throttle({
		default: {
			limit: 10,
			ttl: 60000,
		},
	})
	@Implement(contract.documents.update)
	update() {
		return implement(contract.documents.update).handler(
			async ({ input, context }) => {
				const user = this.getAuthenticatedUser(context as ORPCContext);
				return await this.documentsService.update(input, user.id);
			},
		);
	}

	@Throttle({
		default: {
			limit: 5,
			ttl: 60000,
		},
	})
	@Implement(contract.documents.createVersion)
	createVersion() {
		return implement(contract.documents.createVersion).handler(
			async ({ input, context }) => {
				const user = this.getAuthenticatedUser(context as ORPCContext);
				return await this.documentsService.createVersion(input, user.id);
			},
		);
	}

	@Throttle({
		default: {
			limit: 10,
			ttl: 60000,
		},
	})
	@Implement(contract.documents.createUploadUrl)
	createUploadUrl() {
		return implement(contract.documents.createUploadUrl).handler(
			async ({ input }) => {
				return await this.documentsService.createUploadUrl(input);
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
