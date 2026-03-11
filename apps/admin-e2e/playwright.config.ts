import { defineConfig, devices } from "@playwright/test";

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
			env: {
				...process.env,
				RESEND_API_KEY: process.env.RESEND_API_KEY ?? "test-resend-api-key",
			},
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
