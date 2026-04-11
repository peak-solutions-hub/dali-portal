import { defineConfig, devices } from "@playwright/test";
import { createBackendTestEnv } from "@repo/playwright-utils";

const { backendEnv, backendPort } = createBackendTestEnv({
	suiteName: "admin-e2e",
});

const backendServerCommand = "pnpm --filter backend dev";
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
