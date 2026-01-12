import { NestFactory } from "@nestjs/core";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { contract } from "@repo/shared";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "@/app/app.module";
import { ConfigService } from "@/lib/config.service";

async function bootstrap() {
	// https://orpc.dev/docs/openapi/integrations/implement-contract-in-nest#body-parser
	const app = await NestFactory.create(AppModule, {
		bodyParser: false,
	});

	app.enableCors({
		origin: ["http://localhost:3000", "http://localhost:3001"],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Accept"],
		credentials: true,
	});

	const configService = app.get(ConfigService);

	// Enable CORS
	app.enableCors({
		origin: configService.getOrThrow("corsOrigins").split(","),
		credentials: true,
	});

	const port = configService.getOrThrow("port");

	const openAPIGenerator = new OpenAPIGenerator({
		schemaConverters: [new ZodToJsonSchemaConverter({})],
	});

	const openAPISpec = await openAPIGenerator.generate(contract, {
		info: {
			title: "DALI Portal API",
			version: "0.0.1",
			description: "API documentation for DALI Portal backend",
		},
		servers: [
			{
				url: `http://localhost:${port}`,
				description: "Development server",
			},
		],
		// TODO: restrict access to api docs
		// security: [{}],
	});

	// serve openapi spec
	app.use("/openapi.json", (req, res) => {
		res.setHeader("Content-Type", "application/json");
		res.send(JSON.stringify(openAPISpec));
	});

	// serve api docs with scalar
	app.use(
		"/docs",
		apiReference({
			theme: "moon",
			url: "/openapi.json",
			favicon: "https://avatars.githubusercontent.com/u/301879?s=48&v=4",
		}),
	);

	await app.listen(port);
	console.log(`🚀 Application is running on: http://localhost:${port}`);
	console.log(`📚 API docs available at: http://localhost:${port}/docs`);
}
bootstrap();
