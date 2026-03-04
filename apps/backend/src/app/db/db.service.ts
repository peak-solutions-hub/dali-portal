import { Injectable, Logger } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { ConfigService } from "@/lib/config.service";

/**
 * Connection pool settings.
 * The client pool limits the number of *concurrent* database connections the backend creates.
 * Many users (e.g. 20+) can share a small pool (10) because a query only holds a connection
 * for a few milliseconds at a time. This prevents the server from exhausting the database's
 * overall connection limits while still efficiently serving all users.
 */
const POOL_DEFAULTS = {
	max: 10, // Max concurrent connections to hold in the pool
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 5_000,
} as const;

@Injectable()
export class DbService extends PrismaClient {
	private readonly logger = new Logger(DbService.name);

	constructor(configService: ConfigService) {
		const connectionString = configService.getOrThrow("database.url") as string;

		const adapter = new PrismaPg(
			{
				connectionString,
				max: POOL_DEFAULTS.max,
				idleTimeoutMillis: POOL_DEFAULTS.idleTimeoutMillis,
				connectionTimeoutMillis: POOL_DEFAULTS.connectionTimeoutMillis,
			},
			{
				onPoolError: (err: Error) => {
					this.logger.error(
						`Database pool error: ${err.message}`,
						err.stack,
						"DbService",
					);
				},
			},
		);

		super({ adapter });
		this.logger.log(
			`Database pool configured: max=${POOL_DEFAULTS.max}`,
			"DbService",
		);
	}
}
