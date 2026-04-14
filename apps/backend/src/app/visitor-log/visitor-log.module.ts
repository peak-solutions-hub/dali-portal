import { Module } from "@nestjs/common";
import { VisitorLogController } from "./visitor-log.controller";
import { VisitorLogService } from "./visitor-log.service";

@Module({
	controllers: [VisitorLogController],
	providers: [VisitorLogService],
	exports: [VisitorLogService],
})
export class VisitorLogModule {}
