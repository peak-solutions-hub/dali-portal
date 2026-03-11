import { Module } from "@nestjs/common";
import { AssistanceRecordController } from "./assistance-record.controller";
import { AssistanceRecordService } from "./assistance-record.service";

@Module({
	controllers: [AssistanceRecordController],
	providers: [AssistanceRecordService],
	exports: [AssistanceRecordService],
})
export class AssistanceRecordModule {}
