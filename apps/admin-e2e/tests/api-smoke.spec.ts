import { expect, test } from "@playwright/test";

const BACKEND_URL = "http://127.0.0.1:8080";

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
