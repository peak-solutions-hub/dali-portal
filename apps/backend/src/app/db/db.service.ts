import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

@Injectable()
export class DbService extends PrismaClient {
	constructor(configService: ConfigService) {
		const connectionString = configService.get("DATABASE_URL");

		if (!connectionString) {
			throw new Error("DATABASE_URL environment variable is not set or empty");
		}

		const adapter = new PrismaPg({
			connectionString,
		});

		super({ adapter });
	}
}
