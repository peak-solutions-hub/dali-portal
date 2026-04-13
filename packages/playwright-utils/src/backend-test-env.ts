import fs from "node:fs";
import path from "node:path";

export type BackendTestEnvOptions = {
	suiteName: string;
	backendEnvPath?: string;
};

export type BackendTestEnv = {
	testDatabaseUrl: string;
	backendPort: string;
	backendEnv: NodeJS.ProcessEnv;
};

function getCsvEnvList(value?: string): string[] {
	if (!value) {
		return [];
	}

	return value
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.filter((entry) => entry.length > 0);
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
	const pooledMatch = databaseUrl.match(/postgres\.([a-z0-9]{20})/i);
	if (pooledMatch?.[1]) {
		return pooledMatch[1].toLowerCase();
	}

	const urlMatch = databaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/i);
	if (urlMatch?.[1]) {
		return urlMatch[1].toLowerCase();
	}

	return null;
}

function assertSafeDatabaseTarget(
	databaseUrl: string,
	allowedHostsEnv?: string,
	allowedProjectRefsEnv?: string,
): void {
	if (isLocalDatabaseUrl(databaseUrl)) {
		return;
	}

	let hostname: string;
	try {
		hostname = new URL(databaseUrl).hostname.toLowerCase();
	} catch {
		throw new Error(
			`Refusing to run ${"admin-e2e"} against an invalid DATABASE_URL.`,
		);
	}

	const allowedHosts = getCsvEnvList(allowedHostsEnv);
	if (
		allowedHosts.length === 0 ||
		!allowedHosts.some((pattern) => hostMatchesPattern(hostname, pattern))
	) {
		throw new Error(
			`Refusing to run e2e against database host '${hostname}'. Configure TEST_DB_ALLOWED_HOSTS with explicit test hosts.`,
		);
	}

	const projectRef = extractSupabaseProjectRef(databaseUrl);
	if (!projectRef) {
		throw new Error(
			"Refusing to run e2e: unable to validate Supabase project ref from DATABASE_URL.",
		);
	}

	const allowedProjectRefs = getCsvEnvList(allowedProjectRefsEnv);
	if (
		allowedProjectRefs.length === 0 ||
		!allowedProjectRefs.includes(projectRef)
	) {
		throw new Error(
			`Refusing to run e2e against Supabase project '${projectRef}'. Configure TEST_DB_ALLOWED_PROJECT_REFS with explicit test refs.`,
		);
	}
}

function readEnvFileValue(filePath: string, key: string): string | undefined {
	if (!fs.existsSync(filePath)) {
		return undefined;
	}

	const content = fs.readFileSync(filePath, "utf-8");
	const line = content
		.split(/\r?\n/)
		.find((entry) => entry.trim().startsWith(`${key}=`));

	if (!line) {
		return undefined;
	}

	const raw = line.slice(line.indexOf("=") + 1).trim();
	return raw.replace(/^['"]|['"]$/g, "");
}

export function createBackendTestEnv(
	options: BackendTestEnvOptions,
): BackendTestEnv {
	const isCi = process.env.CI === "true";
	const backendEnvPath =
		options.backendEnvPath ??
		path.resolve(process.cwd(), "../backend/.env.test");

	const fileDatabaseUrl = readEnvFileValue(backendEnvPath, "DATABASE_URL");
	const fileSupabaseUrl = readEnvFileValue(backendEnvPath, "SUPABASE_URL");
	const fileSupabaseAnonKey = readEnvFileValue(
		backendEnvPath,
		"SUPABASE_ANON_KEY",
	);
	const fileSupabaseServiceRoleKey = readEnvFileValue(
		backendEnvPath,
		"SUPABASE_SERVICE_ROLE_KEY",
	);
	const fileSupabaseJwtSecret = readEnvFileValue(
		backendEnvPath,
		"SUPABASE_JWT_SECRET",
	);
	const fileTurnstileSecret = readEnvFileValue(
		backendEnvPath,
		"TURNSTILE_SECRET_KEY",
	);
	const fileResendApiKey = readEnvFileValue(backendEnvPath, "RESEND_API_KEY");
	const filePortalUrl = readEnvFileValue(backendEnvPath, "PORTAL_URL");
	const fileAdminUrl = readEnvFileValue(backendEnvPath, "ADMIN_URL");
	const fileCorsOrigins = readEnvFileValue(backendEnvPath, "CORS_ORIGINS");
	const testDatabaseUrl =
		process.env.DATABASE_URL ??
		fileDatabaseUrl ??
		(isCi ? undefined : process.env.TEST_DATABASE_URL);
	const backendPort =
		process.env.PORT ?? readEnvFileValue(backendEnvPath, "PORT") ?? "8080";

	if (!testDatabaseUrl) {
		throw new Error(
			`DATABASE_URL is required for ${options.suiteName}. Set it via dotenv env loading or apps/backend/.env.test.`,
		);
	}

	const allowedHosts =
		process.env.TEST_DB_ALLOWED_HOSTS ??
		readEnvFileValue(backendEnvPath, "TEST_DB_ALLOWED_HOSTS");
	const allowedProjectRefs =
		process.env.TEST_DB_ALLOWED_PROJECT_REFS ??
		readEnvFileValue(backendEnvPath, "TEST_DB_ALLOWED_PROJECT_REFS");

	assertSafeDatabaseTarget(testDatabaseUrl, allowedHosts, allowedProjectRefs);

	const backendEnv: NodeJS.ProcessEnv = {
		...process.env,
		NODE_ENV: "test",
		PORT: backendPort,
		DATABASE_URL: testDatabaseUrl,
		TURNSTILE_SECRET_KEY:
			process.env.TURNSTILE_SECRET_KEY ??
			fileTurnstileSecret ??
			"test-turnstile-secret-key",
		RESEND_API_KEY:
			process.env.RESEND_API_KEY ?? fileResendApiKey ?? "test-resend-api-key",
		SUPABASE_URL:
			process.env.SUPABASE_URL ??
			fileSupabaseUrl ??
			process.env.NEXT_PUBLIC_SUPABASE_URL ??
			"https://example.supabase.co",
		SUPABASE_ANON_KEY:
			process.env.SUPABASE_ANON_KEY ??
			fileSupabaseAnonKey ??
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
			"test-supabase-anon-key",
		SUPABASE_SERVICE_ROLE_KEY:
			process.env.SUPABASE_SERVICE_ROLE_KEY ??
			fileSupabaseServiceRoleKey ??
			"test-supabase-service-role-key",
		SUPABASE_JWT_SECRET:
			process.env.SUPABASE_JWT_SECRET ??
			fileSupabaseJwtSecret ??
			"test-jwt-secret",
		PORTAL_URL:
			process.env.PORTAL_URL ?? filePortalUrl ?? "http://localhost:3000",
		ADMIN_URL: process.env.ADMIN_URL ?? fileAdminUrl ?? "http://localhost:3001",
		CORS_ORIGINS: process.env.CORS_ORIGINS ?? fileCorsOrigins,
	};

	return {
		testDatabaseUrl,
		backendPort,
		backendEnv,
	};
}
