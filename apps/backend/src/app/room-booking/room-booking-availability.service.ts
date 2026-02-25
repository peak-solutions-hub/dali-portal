import { Injectable, Logger } from "@nestjs/common";
import { ADMIN_BOOKING_ROLES } from "@repo/shared";
import { DbService } from "@/app/db/db.service";

export { ADMIN_BOOKING_ROLES };

@Injectable()
export class RoomBookingAvailabilityService {
	private readonly logger = new Logger(RoomBookingAvailabilityService.name);

	constructor(private readonly db: DbService) {}

	async checkAvailability(
		startTime: Date,
		endTime: Date,
		room: string,
		excludeBookingId?: string,
	): Promise<boolean> {
		const conflicting = await this.db.roomBooking.findFirst({
			where: {
				room: room as never, // cast to Prisma enum
				status: { in: ["confirmed", "pending"] },
				...(excludeBookingId && {
					id: { not: excludeBookingId },
				}),
				// Overlap: existing booking starts before our end AND ends after our start
				AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
			},
			select: { id: true },
		});

		const available = conflicting === null;

		if (!available) {
			this.logger.debug(
				`Conflict detected for room ${room} between ${startTime.toISOString()} – ${endTime.toISOString()}`,
			);
		}

		return available;
	}
}
