import { Module } from "@nestjs/common";
import { RoomBookingController } from "./room-booking.controller";
import { RoomBookingService } from "./room-booking.service";
import { RoomBookingAvailabilityService } from "./room-booking-availability.service";

@Module({
	controllers: [RoomBookingController],
	providers: [RoomBookingService, RoomBookingAvailabilityService],
	exports: [RoomBookingService, RoomBookingAvailabilityService],
})
export class RoomBookingModule {}
