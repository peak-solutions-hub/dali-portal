import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function getTestDatabaseUrl(): string {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error(
			"DATABASE_URL is missing. Load .env.test before running integration tests.",
		);
	}

	return databaseUrl;
}

export function assertSafeTestEnvironment(): void {
	if (process.env.TEST_DB_SAFE !== "true") {
		throw new Error(
			"TEST_DB_SAFE must be true to run integration/e2e database reset operations.",
		);
	}

	if (process.env.NODE_ENV !== "test") {
		Reflect.set(process.env, "NODE_ENV", "test");
	}
}

export function createTestPrismaClient(): PrismaClient {
	const adapter = new PrismaPg({ connectionString: getTestDatabaseUrl() });
	return new PrismaClient({ adapter });
}

export async function resetPublicSchema(prisma: PrismaClient): Promise<void> {
	await prisma.$executeRawUnsafe(`
		DO $$
		DECLARE
			tables text;
		BEGIN
			SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
			INTO tables
			FROM pg_tables
			WHERE schemaname = 'public'
			  AND tablename <> '_prisma_migrations';

			IF tables IS NOT NULL THEN
				EXECUTE 'TRUNCATE TABLE ' || tables || ' RESTART IDENTITY CASCADE';
			END IF;
		END $$;
	`);
}
