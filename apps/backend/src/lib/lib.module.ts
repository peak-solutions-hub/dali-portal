import { Global, Module } from "@nestjs/common";
import {
	ConfigModule as NestConfigModule,
	ConfigService as NestConfigService,
} from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import config from "@/config";
import { ConfigService } from "./config.service";
import { ResendService } from "./resend.service";

@Global()
@Module({
	imports: [
		NestConfigModule.forRoot({
			load: [config],
		}),
		ThrottlerModule.forRootAsync({
			imports: [NestConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => [
				{
					ttl: config.get("throttle.ttl"),
					limit: config.get("throttle.limit"),
				},
			],
		}),
	],
	providers: [
		ConfigService,
		ResendService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
	exports: [ConfigService, ResendService],
})
export class LibModule {}
