import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import config from "@/config";
import { ConfigService } from "./config.service";
import { StorageService } from "./storage.service";

@Global()
@Module({
	imports: [
		NestConfigModule.forRoot({
			load: [config],
		}),
	],
	providers: [ConfigService, StorageService],
	exports: [ConfigService, StorageService],
})
export class LibModule {}
