import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { createBackendTestEnv } from "@repo/playwright-utils";

function loadEnvFile(filePath: string) {
	if (!fs.existsSync(filePath)) {
		return;
	}

	const content = fs.readFileSync(filePath, "utf-8");
	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
			continue;
		}

		const [rawKey, ...rest] = trimmed.split("=");
		const key = rawKey?.trim();
		if (!key) {
			continue;
		}
		const value = rest
			.join("=")
			.trim()
			.replace(/^['"]|['"]$/g, "");
		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}

const configDir = path.dirname(fileURLToPath(import.meta.url));

loadEnvFile(path.resolve(configDir, ".env"));
loadEnvFile(path.resolve(configDir, ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const { backendEnv, backendPort } = createBackendTestEnv({
	suiteName: "admin-e2e",
});

const backendServerEnv: Record<string, string> = {};
for (const [key, value] of Object.entries(backendEnv)) {
	if (typeof value === "string") {
		backendServerEnv[key] = value;
	}
}

backendServerEnv.CORS_ORIGINS =
	backendServerEnv.CORS_ORIGINS ??
	[
		"http://localhost:3000",
		"http://localhost:3001",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:3001",
	].join(",");

const adminServerEnv: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
	if (typeof value === "string") {
		adminServerEnv[key] = value;
	}
}

adminServerEnv.NEXT_PUBLIC_API_URL =
	adminServerEnv.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

if (!adminServerEnv.NEXT_PUBLIC_SUPABASE_URL && adminServerEnv.SUPABASE_URL) {
	adminServerEnv.NEXT_PUBLIC_SUPABASE_URL = adminServerEnv.SUPABASE_URL;
}

if (
	!adminServerEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
	adminServerEnv.SUPABASE_ANON_KEY
) {
	adminServerEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY =
		adminServerEnv.SUPABASE_ANON_KEY;
}

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
		baseURL: "http://localhost:3001",
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
			env: backendServerEnv,
			url: `http://localhost:${backendPort}`,
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
		},
		{
			command: adminServerCommand,
			env: adminServerEnv,
			url: "http://localhost:3001",
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
		},
	],
});
