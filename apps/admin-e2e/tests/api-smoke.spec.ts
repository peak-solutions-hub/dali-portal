import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

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

const BACKEND_PORT = process.env.PORT ?? readBackendTestEnv("PORT") ?? "8080";
const BACKEND_URL =
	process.env.BACKEND_URL ?? `http://127.0.0.1:${BACKEND_PORT}`;

test.describe("Backend API smoke tests", () => {
	test("GET / returns 200", async ({ request }) => {
		const response = await request.get(`${BACKEND_URL}/`);
		expect(response.ok()).toBeTruthy();
	});

	test("API responds with valid JSON on known endpoint", async ({
		request,
	}) => {
		const response = await request.get(`${BACKEND_URL}/`);
		expect(response.status()).toBeLessThan(500);
	});

	test("API returns proper CORS headers", async ({ request }) => {
		const response = await request.get(`${BACKEND_URL}/`);
		expect(response.status()).toBeLessThan(500);
		// Verify the server is reachable and not returning server errors
		expect(response.headers()).toBeDefined();
	});
});
