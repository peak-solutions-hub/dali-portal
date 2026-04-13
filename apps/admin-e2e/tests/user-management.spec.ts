import { expect, type Page, test } from "@playwright/test";
import {
	getAccessTokenForCredentials,
	getRequiredEnv,
	signInAsNonAdmin,
	skipIfMissingDeactivatedCredentials,
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

function getItAdminToken(): Promise<string> {
	return getAccessTokenForCredentials(
		getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
		getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
	);
}

async function openUserManagement(page: Page) {
	await page.goto("/user-management");
	if (/\/login(?:$|\?)/.test(page.url())) {
		await loginWithCredentials(
			page,
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
		);
		await expect(page).not.toHaveURL(/\/login(?:$|\?)/);
		await page.goto("/user-management");
	}
	await expect(
		page.getByRole("heading", { name: "User Management" }),
	).toBeVisible();
	await expect(page.locator("tbody tr").first()).toBeVisible();
}

function pendingFlow(title: string, reason: string) {
	test(title, () => {
		test.fixme(true, reason);
	});
}

test.describe("UM Flows", () => {
	test.beforeEach(async ({ page }, testInfo) => {
		if (/^UM-19\b|^UM-24\b/.test(testInfo.title)) {
			return;
		}

		skipIfMissingItAdminCredentials();
		await loginWithCredentials(
			page,
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
		);
		await expect(page).not.toHaveURL(/\/login(?:$|\?)/);
	});

	test("UM-1 displays user table and action columns", async ({ page }) => {
		await openUserManagement(page);
		await expect(
			page.getByRole("columnheader", { name: "User" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "Role" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "Status" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "Actions" }),
		).toBeVisible();
	});

	test("UM-2 filters users by search (name/email)", async ({ page }) => {
		await openUserManagement(page);
		const firstRow = page.locator("tbody tr").first();
		const nameText = (
			await firstRow.locator("td").first().textContent()
		)?.trim();
		expect(nameText).toBeTruthy();

		const probe = (nameText as string).slice(0, 4);
		await page.getByPlaceholder("Search by name or email...").fill(probe);
		await expect(firstRow).toBeVisible();
	});

	test("UM-3 role filter narrows the table to selected role", async ({
		page,
	}) => {
		await openUserManagement(page);
		await page.getByRole("button", { name: /Filter/i }).click();
		await page.locator("button[role='combobox']").first().click();
		await page.getByRole("option", { name: /IT Admin/i }).click();
		await page.getByRole("button", { name: "Apply Filters" }).first().click();

		const roles = page.locator("tbody tr td:nth-child(2)");
		await expect(roles.first()).toContainText(/IT Admin|it_admin/i);
	});

	test("UM-4 status filter narrows the table", async ({ page }) => {
		await openUserManagement(page);
		await page.getByRole("button", { name: /Filter/i }).click();
		await page.locator("label").filter({ hasText: "Invited" }).first().click();
		await page.getByRole("button", { name: "Apply Filters" }).first().click();

		const statuses = page.locator("tbody tr td:nth-child(3)");
		const rowCount = await page.locator("tbody tr").count();
		test.skip(rowCount === 0, "No invited rows available for status filter.");
		await expect(statuses.first()).toContainText(/Invited/i);
	});

	test("UM-5 invite valid user", async ({ request }) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const listRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(listRes.ok()).toBe(true);
		const listBody = (await listRes.json()) as {
			users?: Array<{ roleId: string; role?: { name?: string } }>;
		};
		const roleId =
			listBody.users?.find((u) => u.role?.name !== "it_admin")?.roleId ??
			listBody.users?.[0]?.roleId;
		expect(roleId).toBeTruthy();

		const response = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Invite Api User",
				email: `um-invite-${Date.now()}@example.com`,
				roleId,
			},
		});

		expect(response.ok()).toBe(true);
	});

	pendingFlow(
		"UM-6 update user full name/role success path",
		"Requires stable disposable fixture user lifecycle for deterministic update assertions in E2E.",
	);

	pendingFlow(
		"UM-7 deactivate active user success path",
		"Requires reversible fixture account and coordinated cleanup in CI.",
	);

	pendingFlow(
		"UM-8 reactivate deactivated user success path",
		"Requires reversible fixture account and coordinated cleanup in CI.",
	);

	test("UM-9 reinvite invited user", async ({ request }) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const listRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(listRes.ok()).toBe(true);
		const listBody = (await listRes.json()) as {
			users?: Array<{ roleId: string; role?: { name?: string } }>;
		};
		const roleId =
			listBody.users?.find((u) => u.role?.name !== "it_admin")?.roleId ??
			listBody.users?.[0]?.roleId;
		expect(roleId).toBeTruthy();

		const email = `um-reinvite-${Date.now()}@example.com`;
		const inviteRes = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Invite Api User",
				email,
				roleId,
			},
		});
		expect(inviteRes.ok()).toBe(true);

		const reinviteRes = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Invite Api User Updated",
				email,
				roleId,
			},
		});
		expect(reinviteRes.ok()).toBe(true);
	});

	test("UM-10 paginates users client-side at 10 items per page", async ({
		page,
	}) => {
		await openUserManagement(page);

		const nextButton = page.getByRole("button", {
			name: "Go to next page",
		});
		const hasNext = await nextButton.isVisible();
		test.skip(
			!hasNext,
			"Dataset has fewer than 11 users; pagination controls are not visible.",
		);

		const firstRowNameBefore = await page
			.locator("tbody tr")
			.first()
			.locator("td")
			.first()
			.textContent();

		await nextButton.click();

		const firstRowNameAfter = await page
			.locator("tbody tr")
			.first()
			.locator("td")
			.first()
			.textContent();

		expect(firstRowNameBefore).not.toEqual(firstRowNameAfter);
	});

	test("UM-11 saving update with no changes closes dialog without update API call", async ({
		page,
	}) => {
		let updateCalls = 0;
		await page.route("**/users/*", async (route) => {
			const req = route.request();
			if (req.method() === "PATCH" && !req.url().includes("/activate/")) {
				updateCalls += 1;
			}
			await route.continue();
		});

		await openUserManagement(page);
		const firstRow = page.locator("tbody tr").first();
		await firstRow.getByRole("button").click();
		await page.getByRole("menuitem", { name: "Edit" }).click();
		await page.getByRole("button", { name: "Save Changes" }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible();
		expect(updateCalls).toBe(0);
	});

	pendingFlow(
		"UM-12 invite existing invited email performs re-invite through invite dialog path",
		"API-level behavior exists; dialog-path E2E still needs deterministic email/fixture orchestration.",
	);

	test("UM-13 shows no users found for unmatched search", async ({ page }) => {
		await openUserManagement(page);
		await page
			.getByPlaceholder("Search by name or email...")
			.fill("no-user-should-match-this-search-term");

		await expect(
			page.getByRole("heading", { name: "No users found" }),
		).toBeVisible();
	});

	test("UM-14 combines search and status filter with AND logic", async ({
		page,
	}) => {
		await openUserManagement(page);
		await page.getByRole("button", { name: /Filter/i }).click();
		await page.locator("label").filter({ hasText: "Invited" }).first().click();
		await page.getByRole("button", { name: "Apply Filters" }).first().click();

		const firstFilteredRow = page.locator("tbody tr").first();
		const rowCount = await page.locator("tbody tr").count();
		test.skip(
			rowCount === 0,
			"No invited rows available for combined-filter assertion.",
		);

		const firstName = (
			await firstFilteredRow.locator("td").first().textContent()
		)?.trim();
		test.skip(!firstName, "Unable to derive search probe from filtered row.");

		await page
			.getByPlaceholder("Search by name or email...")
			.fill((firstName as string).slice(0, 4));

		await expect(firstFilteredRow).toBeVisible();
		await expect(firstFilteredRow.locator("td:nth-child(3)")).toContainText(
			/Invited/i,
		);
	});

	test("UM-15 update dialog email field is read-only", async ({ page }) => {
		await openUserManagement(page);

		const firstRow = page.locator("tbody tr").first();
		await firstRow.getByRole("button").click();
		await page.getByRole("menuitem", { name: "Edit" }).click();

		const emailInput = page.locator("#email");
		await expect(emailInput).toBeDisabled();
	});

	test("UM-16 invite with active email returns conflict", async ({
		request,
	}) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const listRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(listRes.ok()).toBe(true);
		const listBody = (await listRes.json()) as {
			users?: Array<{
				email: string;
				status: string;
				roleId: string;
				role?: { name?: string };
			}>;
		};
		const activeUser = listBody.users?.find((user) => user.status === "active");
		test.skip(
			!activeUser?.email,
			"No active user available for conflict test.",
		);
		const roleId =
			listBody.users?.find((u) => u.role?.name !== "it_admin")?.roleId ??
			listBody.users?.[0]?.roleId;
		expect(roleId).toBeTruthy();

		const response = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Already Active",
				email: activeUser?.email,
				roleId,
			},
		});

		expect([409, 429]).toContain(response.status());
	});

	test("UM-17 invite deactivated email suggests reactivation", async ({
		request,
	}) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const listRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(listRes.ok()).toBe(true);
		const listBody = (await listRes.json()) as {
			users?: Array<{
				email: string;
				status: string;
				roleId: string;
				role?: { name?: string };
			}>;
		};
		const deactivatedUser = listBody.users?.find(
			(user) => user.status === "deactivated",
		);
		test.skip(
			!deactivatedUser?.email,
			"No deactivated user available for reactivation suggestion test.",
		);
		const roleId =
			listBody.users?.find((u) => u.role?.name !== "it_admin")?.roleId ??
			listBody.users?.[0]?.roleId;
		expect(roleId).toBeTruthy();

		const response = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Deactivated Existing",
				email: deactivatedUser?.email,
				roleId,
			},
		});

		expect([400, 429]).toContain(response.status());
	});

	test("UM-18 IT admin cannot demote self", async ({ request }) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const meRes = await request.get(`${apiBase}/users/me`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(meRes.ok()).toBe(true);
		const me = (await meRes.json()) as { id: string };

		const usersRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(usersRes.ok()).toBe(true);
		const usersBody = (await usersRes.json()) as {
			users?: Array<{ roleId: string; role?: { name?: string } }>;
		};
		const nonItRoleId = usersBody.users?.find(
			(user) => user.role?.name !== "it_admin",
		)?.roleId;
		expect(nonItRoleId).toBeTruthy();

		const updateRes = await request.patch(`${apiBase}/users/${me.id}`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				id: me.id,
				roleId: nonItRoleId,
			},
		});

		expect(updateRes.status()).toBe(403);
	});

	test("UM-18A one IT admin can demote another IT admin and restore role/full name", async ({
		request,
	}) => {
		const secondAdminEmail = getRequiredEnv("E2E_IT_ADMIN_2_EMAIL");
		test.skip(
			!secondAdminEmail,
			"Missing E2E_IT_ADMIN_2_EMAIL for cross-admin demotion happy path.",
		);

		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const rolesRes = await request.get(`${apiBase}/roles`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(rolesRes.ok()).toBe(true);
		const rolesBody = (await rolesRes.json()) as {
			roles: Array<{ id: string; name: string }>;
		};

		const itAdminRoleId = rolesBody.roles.find(
			(role) => role.name === "it_admin",
		)?.id;
		const demotionRoleId = rolesBody.roles.find(
			(role) => role.name === "admin_staff",
		)?.id;
		expect(itAdminRoleId).toBeTruthy();
		expect(demotionRoleId).toBeTruthy();

		const usersRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(usersRes.ok()).toBe(true);
		const usersBody = (await usersRes.json()) as {
			users: Array<{
				id: string;
				email: string;
				fullName: string;
				roleId: string;
				role: { name: string };
			}>;
		};

		const secondAdmin = usersBody.users.find(
			(user) =>
				user.email.toLowerCase() === (secondAdminEmail as string).toLowerCase(),
		);
		expect(secondAdmin).toBeTruthy();
		expect(secondAdmin?.role.name).toBe("it_admin");

		const originalFullName = secondAdmin?.fullName as string;
		const renamedFullName = `${originalFullName} Temp`;

		const demoteRes = await request.patch(
			`${apiBase}/users/${secondAdmin?.id as string}`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
				data: {
					id: secondAdmin?.id,
					fullName: renamedFullName,
					roleId: demotionRoleId,
				},
			},
		);
		expect(demoteRes.ok()).toBe(true);
		const demotedUser = (await demoteRes.json()) as {
			fullName: string;
			role: { name: string };
		};
		expect(demotedUser.role.name).toBe("admin_staff");
		expect(demotedUser.fullName).toBe(renamedFullName);

		const restoreRes = await request.patch(
			`${apiBase}/users/${secondAdmin?.id as string}`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
				data: {
					id: secondAdmin?.id,
					fullName: originalFullName,
					roleId: itAdminRoleId,
				},
			},
		);
		expect(restoreRes.ok()).toBe(true);
		const restoredUser = (await restoreRes.json()) as {
			fullName: string;
			role: { name: string };
		};
		expect(restoredUser.role.name).toBe("it_admin");
		expect(restoredUser.fullName).toBe(originalFullName);
	});

	test("UM-19 deactivated user attempts to log in and is blocked", async ({
		page,
	}) => {
		skipIfMissingDeactivatedCredentials();
		await page.context().clearCookies();
		await loginWithCredentials(
			page,
			getRequiredEnv("E2E_DEACTIVATED_EMAIL") as string,
			getRequiredEnv("E2E_DEACTIVATED_PASSWORD") as string,
		);

		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByText(/account has been deactivated/i)).toBeVisible();
	});

	test("UM-20 invite rejects short full name", async ({ page }) => {
		await openUserManagement(page);
		await page.getByRole("button", { name: "Invite New User" }).click();
		await page.locator("#fullName").fill("Abc");
		await page.locator("#email").fill("valid.user@example.com");
		await expect(
			page.getByRole("button", { name: "Send Invitation" }),
		).toBeDisabled();
	});

	pendingFlow(
		"UM-21 set-password with expired/invalid session link",
		"Auth-level scenario exists; UM-specific assertion path still needs deterministic session bootstrap.",
	);

	test("UM-22 invite rejects invalid email format", async ({ page }) => {
		await openUserManagement(page);
		await page.getByRole("button", { name: "Invite New User" }).click();
		await page.locator("#fullName").fill("Valid Full Name");
		await page.locator("#email").fill("invalid-email");
		await expect(
			page.getByRole("button", { name: "Send Invitation" }),
		).toBeDisabled();
	});

	test("UM-23 invite requires role selection", async ({ page }) => {
		await openUserManagement(page);
		await page.getByRole("button", { name: "Invite New User" }).click();
		await page.locator("#fullName").fill("Valid Full Name");
		await page
			.locator("#email")
			.fill(`role-required-${Date.now()}@example.com`);
		await expect(
			page.getByRole("button", { name: "Send Invitation" }),
		).toBeDisabled();
	});

	test("UM-24 non-IT-admin cannot stay on user-management route", async ({
		page,
		context,
		request,
	}) => {
		skipIfMissingNonAdminCredentials();

		const nonAdminToken = await getAccessTokenForCredentials(
			getRequiredEnv("E2E_NON_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_NON_ADMIN_PASSWORD") as string,
		);
		const meRes = await request.get(`${getApiBaseUrl()}/users/me`, {
			headers: { Authorization: `Bearer ${nonAdminToken}` },
		});
		expect(meRes.ok()).toBe(true);
		const me = (await meRes.json()) as {
			role?: { name?: string };
		};
		test.skip(
			me.role?.name === "it_admin",
			"E2E_NON_ADMIN credentials currently map to an it_admin user in this environment.",
		);

		await signInAsNonAdmin(context);

		await page.goto("/user-management");
		await expect(page).not.toHaveURL(/\/user-management$/);
		await expect(page).toHaveURL(/\/(login|unauthorized|dashboard)/);
	});

	test("UM-25 unauthenticated access redirects to login with redirect path", async ({
		browser,
	}) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.goto("/user-management");
		await expect(page).toHaveURL(/\/login/);
		await expect(page).toHaveURL(/redirect=%2Fuser-management/);
		await context.close();
	});

	test("UM-26 activate already-active user returns bad request", async ({
		request,
	}) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const meRes = await request.get(`${apiBase}/users/me`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(meRes.ok()).toBe(true);
		const me = (await meRes.json()) as { id: string };

		const activateRes = await request.patch(
			`${apiBase}/users/activate/${me.id}`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
				data: { id: me.id },
			},
		);

		expect(activateRes.status()).toBe(400);
	});

	test("UM-27 invite endpoint is rate-limited after 3 requests per minute", async ({
		request,
	}) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

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
		}

		expect(statuses[3]).toBe(429);
	});

	test("UM-28 update missing user returns not found", async ({ request }) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const missingId = "11111111-1111-4111-8111-111111111111";
		const response = await request.patch(`${apiBase}/users/${missingId}`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				id: missingId,
				fullName: "Missing User",
			},
		});

		expect(response.status()).toBe(404);
	});
});
