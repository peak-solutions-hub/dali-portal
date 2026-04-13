import { expect, type Page } from "@playwright/test";

export async function openLogin(page: Page, search = "") {
	await page.goto(`/login${search}`);
	await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
}

export async function loginWithCredentials(
	page: Page,
	email: string,
	password: string,
) {
	await openLogin(page);
	await page.locator("#email").fill(email);
	await page.locator("#password").fill(password);

	await page.getByRole("button", { name: "Sign In" }).click();

	// Allow auth requests and potential navigation to settle.
	await page.waitForLoadState("networkidle");
}

export async function openForgotPassword(page: Page) {
	await page.goto("/forgot-password");
	await expect(
		page.getByRole("button", { name: "Send Reset Link" }),
	).toBeVisible();
}

export async function submitForgotPassword(page: Page, email: string) {
	await openForgotPassword(page);
	await page.locator('input[type="email"]').fill(email);
	await page.getByRole("button", { name: "Send Reset Link" }).click();
}

export async function expectForgotPasswordSuccess(page: Page) {
	await expect(page.getByText("Check Your Email")).toBeVisible();
	await expect(
		page.getByText("If an account exists for this email"),
	).toBeVisible();
}
