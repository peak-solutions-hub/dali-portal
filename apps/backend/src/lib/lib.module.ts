import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import config from "@/config";
import { ConfigService } from "@/lib/config.service";
import { ResendService } from "@/lib/resend.service";
import { TurnstileService } from "@/lib/turnstile.service";

@Global()
@Module({
	imports: [
		NestConfigModule.forRoot({
			load: [config],
		}),
	],
	providers: [ConfigService, ResendService, TurnstileService],
	exports: [ConfigService, ResendService, TurnstileService],
})
export class LibModule {}
