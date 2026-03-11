import { Module } from "@nestjs/common";
import { ScholarshipApplicationController } from "./scholarship-application.controller";
import { ScholarshipApplicationService } from "./scholarship-application.service";

@Module({
	controllers: [ScholarshipApplicationController],
	providers: [ScholarshipApplicationService],
	exports: [ScholarshipApplicationService],
})
export class ScholarshipApplicationModule {}
