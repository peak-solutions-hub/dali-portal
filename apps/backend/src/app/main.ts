import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app/app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get("PORT") ?? 8080;

	await app.listen(port);
	console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
