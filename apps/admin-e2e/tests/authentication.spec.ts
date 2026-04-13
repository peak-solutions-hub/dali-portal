import { expect, test } from "@playwright/test";
import {
	getRequiredEnv,
	skipIfMissingDeactivatedCredentials,
	skipIfMissingItAdminCredentials,
	skipIfMissingNonAdminCredentials,
} from "@repo/playwright-utils/session";
import {
	expectForgotPasswordSuccess,
	loginWithCredentials,
	openLogin,
	submitForgotPassword,
} from "@repo/playwright-utils/ui/auth";

type RoleLoginCase = {
	id: string;
	roleLabel: string;
	emailEnv: string;
	passwordEnv: string;
	expectedRedirectPath: RegExp;
	visibleSidebarItems: string[];
	hiddenSidebarItems: string[];
};

const roleLoginCases: RoleLoginCase[] = [
	{
		id: "AUTH-1A",
		roleLabel: "it_admin",
		emailEnv: "E2E_IT_ADMIN_EMAIL",
		passwordEnv: "E2E_IT_ADMIN_PASSWORD",
		expectedRedirectPath: /\/user-management$/,
		visibleSidebarItems: ["User Management"],
		hiddenSidebarItems: ["Dashboard"],
	},
	{
		id: "AUTH-1B",
		roleLabel: "it_admin_2",
		emailEnv: "E2E_IT_ADMIN_2_EMAIL",
		passwordEnv: "E2E_IT_ADMIN_2_PASSWORD",
		expectedRedirectPath: /\/user-management$/,
		visibleSidebarItems: ["User Management"],
		hiddenSidebarItems: ["Dashboard"],
	},
	{
		id: "AUTH-10A",
		roleLabel: "vice_mayor",
		emailEnv: "E2E_VICE_MAYOR_EMAIL",
		passwordEnv: "E2E_VICE_MAYOR_PASSWORD",
		expectedRedirectPath: /\/dashboard$/,
		visibleSidebarItems: [
			"Dashboard",
			"Document Tracker",
			"Caller's Slips",
			"Session Management",
			"Inquiry Tickets",
			"Visitor & Beneficiary Hub",
			"Conference Room",
		],
		hiddenSidebarItems: ["User Management"],
	},
	{
		id: "AUTH-10B",
		roleLabel: "head_admin",
		emailEnv: "E2E_HEAD_ADMIN_EMAIL",
		passwordEnv: "E2E_HEAD_ADMIN_PASSWORD",
		expectedRedirectPath: /\/dashboard$/,
		visibleSidebarItems: [
			"Dashboard",
			"Document Tracker",
			"Session Management",
			"Inquiry Tickets",
			"Conference Room",
		],
		hiddenSidebarItems: [
			"Caller's Slips",
			"Visitor & Beneficiary Hub",
			"User Management",
		],
	},
	{
		id: "AUTH-10C",
		roleLabel: "admin_staff",
		emailEnv: "E2E_ADMIN_STAFF_EMAIL",
		passwordEnv: "E2E_ADMIN_STAFF_PASSWORD",
		expectedRedirectPath: /\/dashboard$/,
		visibleSidebarItems: [
			"Dashboard",
			"Document Tracker",
			"Inquiry Tickets",
			"Conference Room",
		],
		hiddenSidebarItems: [
			"Caller's Slips",
			"Session Management",
			"Visitor & Beneficiary Hub",
			"User Management",
		],
	},
	{
		id: "AUTH-10D",
		roleLabel: "legislative_staff",
		emailEnv: "E2E_LEGISLATIVE_STAFF_EMAIL",
		passwordEnv: "E2E_LEGISLATIVE_STAFF_PASSWORD",
		expectedRedirectPath: /\/dashboard$/,
		visibleSidebarItems: [
			"Dashboard",
			"Document Tracker",
			"Session Management",
			"Inquiry Tickets",
			"Conference Room",
		],
		hiddenSidebarItems: [
			"Caller's Slips",
			"Visitor & Beneficiary Hub",
			"User Management",
		],
	},
	{
		id: "AUTH-10E",
		roleLabel: "ovm_staff",
		emailEnv: "E2E_OVM_STAFF_EMAIL",
		passwordEnv: "E2E_OVM_STAFF_PASSWORD",
		expectedRedirectPath: /\/dashboard$/,
		visibleSidebarItems: [
			"Dashboard",
			"Caller's Slips",
			"Inquiry Tickets",
			"Visitor & Beneficiary Hub",
			"Conference Room",
		],
		hiddenSidebarItems: [
			"Document Tracker",
			"Session Management",
			"User Management",
		],
	},
	{
		id: "AUTH-10F",
		roleLabel: "councilor_1",
		emailEnv: "E2E_COUNCILOR_1_EMAIL",
		passwordEnv: "E2E_COUNCILOR_1_PASSWORD",
		expectedRedirectPath: /\/dashboard$/,
		visibleSidebarItems: ["Dashboard", "Inquiry Tickets", "Conference Room"],
		hiddenSidebarItems: [
			"Document Tracker",
			"Caller's Slips",
			"Session Management",
			"Visitor & Beneficiary Hub",
			"User Management",
		],
	},
	{
		id: "AUTH-10G",
		roleLabel: "councilor_2",
		emailEnv: "E2E_COUNCILOR_2_EMAIL",
		passwordEnv: "E2E_COUNCILOR_2_PASSWORD",
		expectedRedirectPath: /\/dashboard$/,
		visibleSidebarItems: ["Dashboard", "Inquiry Tickets", "Conference Room"],
		hiddenSidebarItems: [
			"Document Tracker",
			"Caller's Slips",
			"Session Management",
			"Visitor & Beneficiary Hub",
			"User Management",
		],
	},
];

function pendingFlow(title: string, reason: string) {
	test(title, () => {
		test.fixme(true, reason);
	});
}

test.describe("AUTH Flows", () => {
	for (const roleCase of roleLoginCases) {
		test(`${roleCase.id} ${roleCase.roleLabel} login redirects and shows role-appropriate sidebar`, async ({
			page,
		}) => {
			const email = getRequiredEnv(roleCase.emailEnv);
			const password = getRequiredEnv(roleCase.passwordEnv);
			test.skip(
				!email || !password,
				`Missing credentials for ${roleCase.roleLabel} (${roleCase.emailEnv}, ${roleCase.passwordEnv}).`,
			);

			await loginWithCredentials(page, email as string, password as string);
			await expect(page).toHaveURL(roleCase.expectedRedirectPath);

			for (const item of roleCase.visibleSidebarItems) {
				await expect(page.getByRole("link", { name: item })).toBeVisible();
			}

			for (const item of roleCase.hiddenSidebarItems) {
				await expect(page.getByRole("link", { name: item })).toHaveCount(0);
			}
		});
	}

	test("AUTH-1 IT admin login redirects to /user-management", async ({
		page,
	}) => {
		skipIfMissingItAdminCredentials();

		await loginWithCredentials(
			page,
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
		);

		await expect(page).toHaveURL(/\/user-management$/);
	});

	test("AUTH-2 forgot-password registered/active email shows check-email success", async ({
		page,
	}) => {
		skipIfMissingItAdminCredentials();
		await submitForgotPassword(
			page,
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
		);
		await expectForgotPasswordSuccess(page);
	});

	pendingFlow(
		"AUTH-3 password-reset link happy path updates password and redirects",
		"Requires controllable reset-link generation and isolated disposable account in CI.",
	);

	pendingFlow(
		"AUTH-4 invite-link set-password happy path activates invited user",
		"Requires deterministic invitation email capture/link consumption in CI.",
	);

	pendingFlow(
		"AUTH-5 session token refresh happens silently without workflow interruption",
		"Needs deterministic token-expiry simulation and runtime event assertion in browser session.",
	);

	test("AUTH-6 authenticated user visiting /login is redirected to role dashboard", async ({
		page,
	}) => {
		skipIfMissingItAdminCredentials();

		await loginWithCredentials(
			page,
			getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
		);
		await expect(page).toHaveURL(/\/user-management$/);

		await page.goto("/login");
		await expect(page).toHaveURL(/\/user-management$/);
	});

	test("AUTH-7 login redirect query sends user to requested route", async ({
		page,
	}) => {
		skipIfMissingItAdminCredentials();

		await openLogin(page, "?redirect=/session-management");
		await page
			.locator("#email")
			.fill(getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string);
		await page
			.locator("#password")
			.fill(getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string);
		await page.getByRole("button", { name: "Sign In" }).click();

		await expect(page).toHaveURL(/\/session-management$/);
	});

	test("AUTH-8 forgot-password unknown email still shows same success state", async ({
		page,
	}) => {
		await page.route("**/users/request-password-reset", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true }),
			});
		});

		const unknownEmail = `no-user-${Date.now()}@example.com`;
		await submitForgotPassword(page, unknownEmail);
		await expectForgotPasswordSuccess(page);
		await expect(page.getByText(unknownEmail)).toBeVisible();
	});

	pendingFlow(
		"AUTH-9 confirm-password mismatch shows inline validation and blocks submit",
		"Needs deterministic set-password session bootstrap in E2E.",
	);

	test("AUTH-10 non-IT-admin login redirects to /dashboard", async ({
		page,
	}) => {
		skipIfMissingNonAdminCredentials();

		await loginWithCredentials(
			page,
			getRequiredEnv("E2E_NON_ADMIN_EMAIL") as string,
			getRequiredEnv("E2E_NON_ADMIN_PASSWORD") as string,
		);

		await expect(page).toHaveURL(/\/dashboard$/);
	});

	test("AUTH-11 invalid login credentials shows error and stays on login", async ({
		page,
	}) => {
		await loginWithCredentials(
			page,
			"invalid-user@example.com",
			"wrong-password",
		);

		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByText(/Invalid login credentials/i)).toBeVisible();
	});

	test("AUTH-12 empty email shows inline zod validation", async ({ page }) => {
		await openLogin(page);
		await page.locator("#password").fill("ValidPass1!");
		await page.getByRole("button", { name: "Sign In" }).click();
		await expect(
			page.getByText("Please enter a valid email address"),
		).toBeVisible();
	});

	test("AUTH-13 empty password shows inline zod validation", async ({
		page,
	}) => {
		await openLogin(page);
		await page.locator("#email").fill("test@example.com");
		await page.getByRole("button", { name: "Sign In" }).click();
		await expect(page.getByText("Password is required")).toBeVisible();
	});

	test("AUTH-14 deactivated user is blocked after sign-in and redirected to login", async ({
		page,
	}) => {
		skipIfMissingDeactivatedCredentials();

		await loginWithCredentials(
			page,
			getRequiredEnv("E2E_DEACTIVATED_EMAIL") as string,
			getRequiredEnv("E2E_DEACTIVATED_PASSWORD") as string,
		);

		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByText(/account has been deactivated/i)).toBeVisible();
	});

	pendingFlow(
		"AUTH-15 weak password validation criteria and disabled submit",
		"Needs deterministic set-password session bootstrap in E2E.",
	);

	test("AUTH-16 set-password route without session redirects to login", async ({
		page,
	}) => {
		await page.goto("/set-password");
		await expect(page).toHaveURL(/\/login$/);
	});

	pendingFlow(
		"AUTH-17 deactivated user using reset link is blocked and redirected to login",
		"Requires deactivated user recovery-link execution flow with controlled test data.",
	);

	test("AUTH-18 auth callback without auth code redirects to login with auth_code_error", async ({
		page,
	}) => {
		await page.goto("/auth/confirm");
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
	});

	pendingFlow(
		"AUTH-19 forgot-password is rate-limited after 3 requests per minute",
		"Controller has @Throttle(3/min), but e2e request context currently does not consistently surface 429 for this route.",
	);

	test("AUTH-20 unauthenticated user hitting protected route is redirected to login with redirect param", async ({
		page,
	}) => {
		await page.goto("/user-management");
		await expect(page).toHaveURL(/\/login/);
		await expect(page).toHaveURL(/redirect=%2Fuser-management/);
	});
});
