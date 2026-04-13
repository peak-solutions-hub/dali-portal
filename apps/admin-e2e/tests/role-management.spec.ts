import { expect, test } from "@playwright/test";
import {
	getAccessTokenForCredentials,
	getRequiredEnv,
	skipIfMissingItAdminCredentials,
	skipIfMissingNonAdminCredentials,
} from "@repo/playwright-utils/session";
import { loginWithCredentials } from "@repo/playwright-utils/ui/auth";

function getApiBaseUrl(): string {
	const explicitBaseUrl =
		process.env.E2E_API_BASE_URL ?? process.env.API_BASE_URL;
	if (explicitBaseUrl && explicitBaseUrl.trim().length > 0) {
		return explicitBaseUrl.replace(/\/$/, "");
	}

	return `http://localhost:${process.env.PORT ?? "8080"}`;
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
		const viceMayorEmail = getRequiredEnv("E2E_VICE_MAYOR_EMAIL");
		const viceMayorPassword = getRequiredEnv("E2E_VICE_MAYOR_PASSWORD");
		const nonAdminEmail = getRequiredEnv("E2E_NON_ADMIN_EMAIL");
		const nonAdminPassword = getRequiredEnv("E2E_NON_ADMIN_PASSWORD");

		const fallbackEmail = viceMayorEmail ?? nonAdminEmail;
		const fallbackPassword = viceMayorPassword ?? nonAdminPassword;

		test.skip(
			!fallbackEmail || !fallbackPassword,
			"Missing role credentials (E2E_VICE_MAYOR_* or E2E_NON_ADMIN_*).",
		);

		await loginWithCredentials(
			page,
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
		);
		await expect(page).toHaveURL(/\/user-management$/);

		await context.clearCookies();
		await page.goto("/login");
		await loginWithCredentials(
			page,
			fallbackEmail as string,
			fallbackPassword as string,
		);
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
