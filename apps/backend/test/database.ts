import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function getCsvEnvList(name: string): string[] {
	const value = process.env[name];
	if (!value) {
		return [];
	}

	return value
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.filter((entry) => entry.length > 0);
}

function getHostname(databaseUrl: string): string {
	try {
		return new URL(databaseUrl).hostname.toLowerCase();
	} catch {
		throw new Error(
			"Refusing to run destructive test resets: DATABASE_URL is not a valid URL.",
		);
	}
}

function hostMatchesPattern(hostname: string, pattern: string): boolean {
	if (pattern.startsWith("*.")) {
		const suffix = pattern.slice(2);
		return hostname === suffix || hostname.endsWith(`.${suffix}`);
	}

	return hostname === pattern;
}

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

	const hostname = getHostname(databaseUrl);
	const allowedHosts = getCsvEnvList("TEST_DB_ALLOWED_HOSTS");

	if (
		allowedHosts.length === 0 ||
		!allowedHosts.some((pattern) => hostMatchesPattern(hostname, pattern))
	) {
		throw new Error(
			`Refusing to run destructive test resets: host '${hostname}' is not allowed. Configure TEST_DB_ALLOWED_HOSTS in .env.test for non-local targets.`,
		);
	}

	const projectRef = extractSupabaseProjectRef(databaseUrl);
	if (!projectRef) {
		throw new Error(
			"Refusing to run destructive test resets: unable to validate DATABASE_URL Supabase project ref.",
		);
	}

	const allowedProjectRefs = getCsvEnvList("TEST_DB_ALLOWED_PROJECT_REFS");
	if (
		allowedProjectRefs.length === 0 ||
		!allowedProjectRefs.includes(projectRef)
	) {
		throw new Error(
			`Refusing to run destructive test resets: project ref '${projectRef}' is not allowed. Configure TEST_DB_ALLOWED_PROJECT_REFS in .env.test.`,
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

export type UserRoleCleanupSnapshot = {
	userIds: Set<string>;
	roleIds: Set<string>;
};

export async function createUserRoleCleanupSnapshot(
	prisma: PrismaClient,
): Promise<UserRoleCleanupSnapshot> {
	const [users, roles] = await Promise.all([
		prisma.user.findMany({ select: { id: true } }),
		prisma.role.findMany({ select: { id: true } }),
	]);

	return {
		userIds: new Set(users.map((user) => user.id)),
		roleIds: new Set(roles.map((role) => role.id)),
	};
}

export async function cleanupUsersAndRolesFromSnapshot(
	prisma: PrismaClient,
	snapshot: UserRoleCleanupSnapshot,
): Promise<void> {
	const [users, roles] = await Promise.all([
		prisma.user.findMany({ select: { id: true } }),
		prisma.role.findMany({ select: { id: true } }),
	]);

	const createdUserIds = users
		.map((user) => user.id)
		.filter((id) => !snapshot.userIds.has(id));

	if (createdUserIds.length > 0) {
		await prisma.user.deleteMany({
			where: { id: { in: createdUserIds } },
		});
	}

	const createdRoleIds = roles
		.map((role) => role.id)
		.filter((id) => !snapshot.roleIds.has(id));

	if (createdRoleIds.length > 0) {
		await prisma.role.deleteMany({
			where: { id: { in: createdRoleIds } },
		});
	}
}
