import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function isLocalDatabaseUrl(databaseUrl: string): boolean {
	return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(databaseUrl);
}

function extractSupabaseProjectRef(databaseUrl: string): string | null {
	const userInfoMatch = databaseUrl.match(/postgres\.([a-z0-9]{20})/i);
	if (userInfoMatch?.[1]) {
		return userInfoMatch[1].toLowerCase();
	}

	const hostMatch = databaseUrl.match(/([a-z0-9]{20})\.supabase\.co/i);
	if (hostMatch?.[1]) {
		return hostMatch[1].toLowerCase();
	}

	return null;
}

function assertSafeDatabaseTarget(databaseUrl: string): void {
	if (isLocalDatabaseUrl(databaseUrl)) {
		return;
	}

	const projectRef = extractSupabaseProjectRef(databaseUrl);
	if (!projectRef) {
		throw new Error(
			"Refusing to run destructive test resets: unable to validate DATABASE_URL target. Use localhost DB or provide a Supabase test project URL.",
		);
	}
}

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
	assertSafeDatabaseTarget(getTestDatabaseUrl());
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
