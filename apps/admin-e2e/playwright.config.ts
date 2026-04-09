import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const backendTestEnvPath = path.resolve(process.cwd(), "../backend/.env.test");

function readBackendTestEnv(key: string): string | undefined {
	if (!fs.existsSync(backendTestEnvPath)) {
		return undefined;
	}

	const content = fs.readFileSync(backendTestEnvPath, "utf-8");
	const line = content
		.split(/\r?\n/)
		.find((entry) => entry.trim().startsWith(`${key}=`));

	if (!line) {
		return undefined;
	}

	const raw = line.slice(line.indexOf("=") + 1).trim();
	return raw.replace(/^['"]|['"]$/g, "");
}

const testDatabaseUrl =
	process.env.TEST_DATABASE_URL ?? readBackendTestEnv("DATABASE_URL");
const testDbSafe =
	process.env.TEST_DB_SAFE ?? readBackendTestEnv("TEST_DB_SAFE");
const backendPort = process.env.PORT ?? readBackendTestEnv("PORT") ?? "8080";

if (!testDatabaseUrl) {
	throw new Error(
		"TEST_DATABASE_URL is required for admin-e2e. Set it in shell env or apps/backend/.env.test.",
	);
}

if (testDbSafe !== "true") {
	throw new Error(
		"TEST_DB_SAFE=true is required for admin-e2e to run against a test database safely (shell env or apps/backend/.env.test).",
	);
}

const backendEnv = {
	...process.env,
	NODE_ENV: process.env.NODE_ENV ?? "test",
	PORT: backendPort,
	DATABASE_URL: testDatabaseUrl,
	TEST_DB_SAFE: testDbSafe,
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

const backendServerCommand =
	"pnpm --filter backend db:test:prepare && pnpm --filter backend dev";
const adminServerCommand = "pnpm --filter admin dev";

export default defineConfig({
	testDir: "./tests",
	timeout: 60_000,
	expect: {
		timeout: 10_000,
	},
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI
		? [["list"], ["html", { open: "never" }]]
		: [["list"], ["html"]],
	use: {
		baseURL: "http://127.0.0.1:3001",
		trace: "on-first-retry",
		headless: true,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: [
		{
			command: backendServerCommand,
			env: backendEnv,
			url: `http://127.0.0.1:${backendPort}`,
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
		},
		{
			command: adminServerCommand,
			url: "http://127.0.0.1:3001",
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
		},
	],
});
