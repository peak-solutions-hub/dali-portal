import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import config from "@/config";
import { ConfigService } from "./config.service";

@Global()
@Module({
	imports: [
		NestConfigModule.forRoot({
			load: [config],
		}),
	],
	providers: [ConfigService],
	exports: [ConfigService],
})
export class LibModule {}
