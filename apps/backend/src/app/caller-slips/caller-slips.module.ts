import { Module } from "@nestjs/common";
import { CallerSlipsController } from "./caller-slips.controller";
import { CallerSlipsService } from "./caller-slips.service";

@Module({
	controllers: [CallerSlipsController],
	providers: [CallerSlipsService],
	exports: [CallerSlipsService],
})
export class CallerSlipsModule {}
