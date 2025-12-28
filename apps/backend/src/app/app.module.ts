import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@/app/app.controller";
import { AppService } from "@/app/app.service";
import { DbModule } from "@/app/db/db.module";
import config from "@/config";

@Module({
	imports: [ConfigModule.forRoot({ load: [config] }), DbModule],
	controllers: [AppController], // to remove
	providers: [AppService], // to remove
})
export class AppModule {}
