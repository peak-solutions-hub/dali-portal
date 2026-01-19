import { Module } from "@nestjs/common";
import { DbModule } from "@/app/db/db.module";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

@Module({
	imports: [DbModule],
	controllers: [RolesController],
	providers: [RolesService],
	exports: [RolesService],
})
export class RolesModule {}
