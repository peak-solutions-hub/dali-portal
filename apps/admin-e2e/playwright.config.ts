import { defineConfig, devices } from "@playwright/test";

if (!process.env.TEST_DATABASE_URL) {
	throw new Error(
		"TEST_DATABASE_URL is required for admin-e2e. Use test DB credentials only.",
	);
}

const backendEnv = {
	...process.env,
	NODE_ENV: process.env.NODE_ENV ?? "test",
	PORT: process.env.PORT ?? "8080",
	DATABASE_URL: process.env.TEST_DATABASE_URL,
	TEST_DB_SAFE: process.env.TEST_DB_SAFE ?? "true",
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

export default defineConfig({
	testDir: "./tests",
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
			command: "pnpm --filter backend dev",
			env: backendEnv,
			url: "http://127.0.0.1:8080",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		{
			command: "pnpm --filter admin dev",
			url: "http://127.0.0.1:3001",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
	],
});
