import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import config from "@/config";
import { DbModule } from "@/db/db.module";

@Module({
	imports: [ConfigModule.forRoot({ load: [config] }), DbModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
