import { Injectable } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { ConfigService } from "@/lib/config.service";

@Injectable()
export class DbService extends PrismaClient {
	constructor(configService: ConfigService) {
		const adapter = new PrismaPg({
			connectionString: configService.getOrThrow("database.url"),
		});

		super({ adapter });
	}
}
