import { expect, test } from "@playwright/test";
import {
	getAccessTokenForCredentials,
	getRequiredEnv,
	skipIfMissingItAdminCredentials,
} from "./helpers/auth-session.js";

function getApiBaseUrl(): string {
	return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080";
}

test.describe("User Management + Auth rate limits @rate-limit", () => {
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

	test("UM-27 invite endpoint is rate-limited after 3 requests per minute", async ({
		request,
	}) => {
		skipIfMissingItAdminCredentials();

		const apiBase = getApiBaseUrl();
		const accessToken = await getAccessTokenForCredentials(
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
		);

		const usersResponse = await request.get(`${apiBase}/users`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		expect(usersResponse.ok()).toBe(true);

		const usersPayload = (await usersResponse.json()) as {
			users?: Array<{ roleId: string; role?: { name?: string } }>;
		};
		const availableRole = usersPayload.users?.find(
			(user) => user.role?.name && user.role.name !== "it_admin",
		);
		const roleId = availableRole?.roleId ?? usersPayload.users?.[0]?.roleId;
		expect(roleId, "No roleId available from /users payload").toBeTruthy();

		const stamp = Date.now();
		const statuses: number[] = [];
		let lastBody: unknown;

		for (let attempt = 0; attempt < 4; attempt += 1) {
			const response = await request.post(`${apiBase}/users/invite`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				data: {
					fullName: `Rate Limit User ${stamp}${attempt}`,
					email: `um-rate-${stamp}-${attempt}@example.com`,
					roleId,
				},
			});
			statuses.push(response.status());
			lastBody = await response.json().catch(() => null);
		}

		expect(statuses.slice(0, 3).every((status) => status < 500)).toBe(true);
		expect(statuses[3]).toBe(429);
		const serializedBody = JSON.stringify(lastBody);
		expect(
			serializedBody.includes("Too many requests. Please try again later.") ||
				serializedBody.includes("Too Many Requests"),
		).toBe(true);
	});
});
