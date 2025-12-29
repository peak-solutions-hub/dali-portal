import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app/app.module";
import { ConfigService } from "@/lib/config.service";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.getOrThrow("port");

	await app.listen(port);
	console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
