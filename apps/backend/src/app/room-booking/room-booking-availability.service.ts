import { Injectable, Logger } from "@nestjs/common";
import { ADMIN_BOOKING_ROLES } from "@repo/shared";
import { DbService } from "@/app/db/db.service";

export { ADMIN_BOOKING_ROLES };

/**
 * Reusable conflict-detection service.
 *
 * Checks whether a requested time range is available for a given room
 * by querying existing CONFIRMED bookings with overlapping intervals.
 *
 * Overlap condition: RequestStart < ExistingEnd AND RequestEnd > ExistingStart
 */
@Injectable()
export class RoomBookingAvailabilityService {
	private readonly logger = new Logger(RoomBookingAvailabilityService.name);

	constructor(private readonly db: DbService) {}

	/**
	 * Check whether the time slot is available for the given room.
	 *
	 * @param startTime - Start of the requested booking window
	 * @param endTime   - End of the requested booking window
	 * @param room      - Conference room identifier
	 * @param excludeBookingId - When updating an existing booking, exclude it from the check
	 * @returns `true` if the slot is free; `false` if a CONFIRMED booking overlaps
	 */
	async checkAvailability(
		startTime: Date,
		endTime: Date,
		room: string,
		excludeBookingId?: string,
	): Promise<boolean> {
		const conflicting = await this.db.roomBooking.findFirst({
			where: {
				room: room as never, // cast to Prisma enum
				status: "confirmed",
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
