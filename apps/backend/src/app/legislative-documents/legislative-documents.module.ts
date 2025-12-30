import { Module } from "@nestjs/common";
import { DbModule } from "@/app/db/db.module";
import { LegislativeDocumentsController } from "./legislative-documents.controller";
import { LegislativeDocumentsService } from "./legislative-documents.service";

@Module({
	imports: [DbModule],
	controllers: [LegislativeDocumentsController],
	providers: [LegislativeDocumentsService],
})
export class LegislativeDocumentsModule {}
