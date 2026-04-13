import { Controller } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import { AppError, contract, ROLE_PERMISSIONS } from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import type { ORPCContext } from "@/app/types";
import { DocumentsService } from "./documents.service";
import {
	toDocumentDetailResponse,
	toDocumentListResponse,
	toDocumentResponse,
} from "./dtos/document.dto";

@Controller()
@Roles(...ROLE_PERMISSIONS.DOCUMENT_TRACKER)
export class DocumentsController {
	constructor(private readonly documentsService: DocumentsService) {}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.documents.getList)
	getList() {
		return implement(contract.documents.getList).handler(async ({ input }) => {
			const result = await this.documentsService.getList(input);
			return toDocumentListResponse(result);
		});
	}

	@SkipThrottle({ short: true, default: true })
	@Implement(contract.documents.getById)
	getById() {
		return implement(contract.documents.getById).handler(async ({ input }) => {
			const result = await this.documentsService.getById(input.id);
			return toDocumentDetailResponse(result);
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
				const result = await this.documentsService.updateStatus(
					input,
					user.id,
					user.role,
				);

				return toDocumentResponse(result);
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
				const result = await this.documentsService.update(input, user.id);
				return toDocumentResponse(result);
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
				const result = await this.documentsService.createVersion(
					input,
					user.id,
				);
				return toDocumentDetailResponse(result);
			},
		);
	}

	@Throttle({
		default: {
			limit: 10,
			ttl: 60000,
		},
	})
	@Roles("head_admin", "legislative_staff")
	@Implement(contract.documents.publish)
	publish() {
		return implement(contract.documents.publish).handler(
			async ({ input, context }) => {
				const user = this.getAuthenticatedUser(context as ORPCContext);
				return await this.documentsService.publish(input, user.id);
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

	@Throttle({
		default: {
			limit: 10,
			ttl: 60000,
		},
	})
	@Implement(contract.documents.deleteUpload)
	deleteUpload() {
		return implement(contract.documents.deleteUpload).handler(
			async ({ input }) => {
				return await this.documentsService.deleteUpload(input);
			},
		);
	}

	@Throttle({
		default: {
			limit: 5,
			ttl: 60000,
		},
	})
	@Roles("head_admin", "admin_staff", "legislative_staff")
	@Implement(contract.documents.delete)
	deleteDocument() {
		return implement(contract.documents.delete).handler(
			async ({ input, context }) => {
				const user = this.getAuthenticatedUser(context as ORPCContext);
				return await this.documentsService.deleteDocument(
					input,
					user.id,
					user.role,
				);
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
