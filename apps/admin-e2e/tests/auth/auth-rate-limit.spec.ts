import { expect, test } from "@playwright/test";

function getApiBaseUrl(): string {
	return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080";
}

test.describe("Auth rate limits @rate-limit", () => {
	test("AUTH-19 forgot-password is rate-limited after 3 requests per minute", async ({
		request,
	}) => {
		const apiBase = getApiBaseUrl();
		const stamp = Date.now();
		const statuses: number[] = [];
		let lastBody: unknown;

		for (let attempt = 0; attempt < 4; attempt += 1) {
			const response = await request.post(
				`${apiBase}/users/request-password-reset`,
				{
					data: {
						email: `auth-rate-${stamp}-${attempt}@example.com`,
					},
				},
			);
			statuses.push(response.status());
			lastBody = await response.json().catch(() => null);
		}

		expect(statuses.slice(0, 3).every((status) => status === 200)).toBe(true);
		expect(statuses[3]).toBe(429);
		const serializedBody = JSON.stringify(lastBody);
		expect(
			serializedBody.includes("Too many requests. Please try again later.") ||
				serializedBody.includes("Too Many Requests"),
		).toBe(true);
	});
});
