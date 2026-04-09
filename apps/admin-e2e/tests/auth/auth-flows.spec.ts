import { expect, test } from "@playwright/test";
import {
	getRequiredEnv,
	skipIfMissingDeactivatedCredentials,
	skipIfMissingItAdminCredentials,
	skipIfMissingNonAdminCredentials,
} from "../helpers/auth-session.js";
import {
	expectForgotPasswordSuccess,
	loginWithCredentials,
	openForgotPassword,
	openLogin,
	submitForgotPassword,
} from "../helpers/auth-ui.js";

test.describe("Auth flows", () => {
	test("AUTH-20 unauthenticated user hitting protected route is redirected to login with redirect param", async ({
		page,
	}) => {
		await page.goto("/user-management");
		await expect(page).toHaveURL(/\/login/);
		await expect(page).toHaveURL(/redirect=%2Fuser-management/);
	});

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

	test("AUTH-16 set-password route without session redirects to login", async ({
		page,
	}) => {
		await page.goto("/set-password");
		await expect(page).toHaveURL(/\/login$/);
	});

	test("AUTH-18 auth callback without auth code redirects to login with auth_code_error", async ({
		page,
	}) => {
		await page.goto("/auth/confirm");
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
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

	test("AUTH-2 alternate path from forgot-password page back to sign in works", async ({
		page,
	}) => {
		await openForgotPassword(page);
		await page.getByRole("button", { name: "Back to Sign In" }).click();
		await expect(page).toHaveURL(/\/login$/);
	});
});
