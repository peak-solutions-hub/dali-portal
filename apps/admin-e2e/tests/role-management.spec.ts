import { expect, test } from "@playwright/test";
import {
	getAccessTokenForCredentials,
	getRequiredEnv,
	signInAsItAdmin,
	signInAsNonAdmin,
	skipIfMissingItAdminCredentials,
	skipIfMissingNonAdminCredentials,
} from "@repo/playwright-utils/session";

function getApiBaseUrl(): string {
	if (process.env.NEXT_PUBLIC_API_URL) {
		return process.env.NEXT_PUBLIC_API_URL;
	}

	return `http://127.0.0.1:${process.env.PORT ?? "8080"}`;
}

function pendingFlow(title: string, reason: string) {
	test(title, () => {
		test.fixme(true, reason);
	});
}

test.describe("RM Flows", () => {
	test("RM-1 IT admin can fetch all roles sorted by name", async ({
		request,
	}) => {
		skipIfMissingItAdminCredentials();
		const accessToken = await getAccessTokenForCredentials(
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
		);

		const response = await request.get(`${getApiBaseUrl()}/roles`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		expect(response.ok()).toBe(true);
		const body = (await response.json()) as {
			roles?: Array<{ name: string }>;
		};

		expect(body.roles?.length).toBe(7);
		const roleNames = (body.roles ?? []).map((role) => role.name);
		expect(roleNames).toEqual(
			[...roleNames].sort((a, b) => a.localeCompare(b)),
		);
	});

	test("RM-2 IT admin can retrieve role names used by feature permissions", async ({
		request,
	}) => {
		skipIfMissingItAdminCredentials();
		const accessToken = await getAccessTokenForCredentials(
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
		);

		const response = await request.get(`${getApiBaseUrl()}/roles`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		expect(response.ok()).toBe(true);
		const body = (await response.json()) as {
			roles?: Array<{ name: string }>;
		};

		const roleNames = new Set((body.roles ?? []).map((role) => role.name));
		expect(roleNames.has("it_admin")).toBe(true);
		expect(roleNames.has("vice_mayor")).toBe(true);
		expect(roleNames.has("admin_staff")).toBe(true);
	});

	test("RM-3 sidebar navigation is filtered by role", async ({
		page,
		context,
	}) => {
		skipIfMissingItAdminCredentials();
		skipIfMissingNonAdminCredentials();

		await signInAsItAdmin(context);
		await page.goto("/dashboard");
		await expect(
			page.getByRole("link", { name: "User Management" }),
		).toBeVisible();

		await context.clearCookies();
		await signInAsNonAdmin(context);
		await page.goto("/dashboard");
		await expect(
			page.getByRole("link", { name: "User Management" }),
		).toHaveCount(0);
	});

	pendingFlow(
		"RM-4 vice_mayor sees Caller Slips + Visitor Hub while admin_staff does not",
		"Requires role-specific credential pairs for vice_mayor and admin_staff in CI.",
	);

	pendingFlow(
		"RM-5 GET /roles returns cached response and invalidates on role update",
		"Current roles service has no explicit cache layer to assert against.",
	);

	test("RM-6 unauthenticated GET /roles returns 401", async ({ request }) => {
		const response = await request.get(`${getApiBaseUrl()}/roles`);
		expect(response.status()).toBe(401);
	});

	test("RM-7 non-IT-admin GET /roles returns 403", async ({ request }) => {
		skipIfMissingNonAdminCredentials();

		const accessToken = await getAccessTokenForCredentials(
			getRequiredEnv("E2E_NON_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_NON_ADMIN_PASSWORD") as string,
		);

		const response = await request.get(`${getApiBaseUrl()}/roles`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		expect(response.status()).toBe(403);
	});

	pendingFlow(
		"RM-8 missing/unrecognized role defaults to dashboard with minimal nav",
		"Requires controlled auth profile mutation for invalid role state.",
	);
});
