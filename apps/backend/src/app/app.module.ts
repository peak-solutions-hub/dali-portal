import { Module } from "@nestjs/common";
import { AppController } from "@/app/app.controller";
import { AppService } from "@/app/app.service";
import { DbModule } from "@/app/db/db.module";
import { LibModule } from "@/lib/lib.module";

@Module({
	imports: [LibModule, DbModule],
	controllers: [AppController], // to remove
	providers: [AppService], // to remove
})
export class AppModule {}
