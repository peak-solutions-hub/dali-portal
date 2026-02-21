import { Controller } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { Implement, implement } from "@orpc/nest";
import {
	APPROVAL_ROLES,
	AppError,
	contract,
	ROLE_PERMISSIONS,
} from "@repo/shared";
import { Roles } from "@/app/auth/decorators/roles.decorator";
import type { ORPCContext } from "@/app/types";
import { RoomBookingService } from "./room-booking.service";

@Controller()
export class RoomBookingController {
	constructor(private readonly roomBookingService: RoomBookingService) {}

	// ---------------------------------------------------------------------------
	// GET /admin/bookings
	// ---------------------------------------------------------------------------

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.CONFERENCE_ROOM)
	@Implement(contract.roomBookings.getList)
	getList() {
		return implement(contract.roomBookings.getList).handler(
			async ({ input, context }) => {
				const { request } = context as ORPCContext;
				const user = request.user;

				if (!user?.id) {
					throw new AppError("AUTH.AUTHENTICATION_REQUIRED");
				}

				return await this.roomBookingService.getList(input, user.role);
			},
		);
	}

	// ---------------------------------------------------------------------------
	// GET /admin/bookings/{id}
	// ---------------------------------------------------------------------------

	@SkipThrottle({ short: true, default: true })
	@Roles(...ROLE_PERMISSIONS.CONFERENCE_ROOM)
	@Implement(contract.roomBookings.getById)
	getById() {
		return implement(contract.roomBookings.getById).handler(
			async ({ input }) => {
				return await this.roomBookingService.getById(input);
			},
		);
	}

	// ---------------------------------------------------------------------------
	// POST /admin/bookings
	// ---------------------------------------------------------------------------

	// 10 requests per minute per user
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Roles(...ROLE_PERMISSIONS.CONFERENCE_ROOM)
	@Implement(contract.roomBookings.create)
	create() {
		return implement(contract.roomBookings.create).handler(
			async ({ input, context }) => {
				const { request } = context as ORPCContext;
				const user = request.user;

				if (!user?.id) {
					throw new AppError("AUTH.AUTHENTICATION_REQUIRED");
				}

				return await this.roomBookingService.create(input, user.id, user.role);
			},
		);
	}

	// ---------------------------------------------------------------------------
	// PATCH /admin/bookings/{id}/status
	// ---------------------------------------------------------------------------

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@Roles(...APPROVAL_ROLES)
	@Implement(contract.roomBookings.updateStatus)
	updateStatus() {
		return implement(contract.roomBookings.updateStatus).handler(
			async ({ input, context }) => {
				const { request } = context as ORPCContext;
				const user = request.user;

				if (!user?.id) {
					throw new AppError("AUTH.AUTHENTICATION_REQUIRED");
				}

				return await this.roomBookingService.updateStatus(input, user.role);
			},
		);
	}

	// ---------------------------------------------------------------------------
	// PUT /admin/bookings/{id}
	// ---------------------------------------------------------------------------

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@Roles(...ROLE_PERMISSIONS.CONFERENCE_ROOM)
	@Implement(contract.roomBookings.update)
	update() {
		return implement(contract.roomBookings.update).handler(
			async ({ input, context }) => {
				const { request } = context as ORPCContext;
				const user = request.user;

				if (!user?.id) {
					throw new AppError("AUTH.AUTHENTICATION_REQUIRED");
				}

				return await this.roomBookingService.update(input, user.id);
			},
		);
	}

	// ---------------------------------------------------------------------------
	// DELETE /admin/bookings/{id}
	// ---------------------------------------------------------------------------

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Roles(...ROLE_PERMISSIONS.CONFERENCE_ROOM)
	@Implement(contract.roomBookings.delete)
	delete() {
		return implement(contract.roomBookings.delete).handler(
			async ({ input, context }) => {
				const { request } = context as ORPCContext;
				const user = request.user;

				if (!user?.id) {
					throw new AppError("AUTH.AUTHENTICATION_REQUIRED");
				}

				return await this.roomBookingService.delete(
					input.id,
					user.id,
					user.role,
				);
			},
		);
	}

	// ---------------------------------------------------------------------------
	// POST /admin/bookings/upload-url
	// ---------------------------------------------------------------------------

	// 5 per minute — upload URL generation is sensitive
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@Roles(...ROLE_PERMISSIONS.CONFERENCE_ROOM)
	@Implement(contract.roomBookings.generateUploadUrl)
	generateUploadUrl() {
		return implement(contract.roomBookings.generateUploadUrl).handler(
			async ({ input }) => {
				return await this.roomBookingService.generateUploadUrl(input);
			},
		);
	}
}
