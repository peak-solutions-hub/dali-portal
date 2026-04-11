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
	const backendEnvPath =
		options.backendEnvPath ??
		path.resolve(process.cwd(), "../backend/.env.test");

	const fileDatabaseUrl = readEnvFileValue(backendEnvPath, "DATABASE_URL");
	const testDatabaseUrl =
		process.env.DATABASE_URL ??
		fileDatabaseUrl ??
		process.env.TEST_DATABASE_URL;
	const backendPort =
		process.env.PORT ?? readEnvFileValue(backendEnvPath, "PORT") ?? "8080";

	if (!testDatabaseUrl) {
		throw new Error(
			`DATABASE_URL is required for ${options.suiteName}. Set it via dotenv env loading or apps/backend/.env.test.`,
		);
	}

	const backendEnv: NodeJS.ProcessEnv = {
		...process.env,
		NODE_ENV: "test",
		PORT: backendPort,
		DATABASE_URL: testDatabaseUrl,
		TURNSTILE_SECRET_KEY:
			process.env.TURNSTILE_SECRET_KEY ?? "test-turnstile-secret-key",
		RESEND_API_KEY: process.env.RESEND_API_KEY ?? "test-resend-api-key",
		SUPABASE_URL:
			process.env.SUPABASE_URL ??
			process.env.NEXT_PUBLIC_SUPABASE_URL ??
			"https://example.supabase.co",
		SUPABASE_ANON_KEY:
			process.env.SUPABASE_ANON_KEY ??
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
			"test-supabase-anon-key",
		SUPABASE_SERVICE_ROLE_KEY:
			process.env.SUPABASE_SERVICE_ROLE_KEY ?? "test-supabase-service-role-key",
		SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET ?? "test-jwt-secret",
		PORTAL_URL: process.env.PORTAL_URL ?? "http://127.0.0.1:3000",
		ADMIN_URL: process.env.ADMIN_URL ?? "http://127.0.0.1:3001",
	};

	return {
		testDatabaseUrl,
		backendPort,
		backendEnv,
	};
}
