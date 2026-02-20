import { Module } from "@nestjs/common";
import { SessionPortalController } from "./session-portal.controller";
import { SessionPortalService } from "./session-portal.service";

@Module({
	controllers: [SessionPortalController],
	providers: [SessionPortalService],
	exports: [SessionPortalService],
})
export class SessionPortalModule {}
