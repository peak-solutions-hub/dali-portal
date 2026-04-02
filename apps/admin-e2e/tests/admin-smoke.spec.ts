import { expect, test } from "@playwright/test";
import { expectPageHealthy } from "@repo/playwright-utils";

test("admin app responds", async ({ page }) => {
	await expectPageHealthy(page, "/");
});

test("admin returns valid HTML structure", async ({ page }) => {
	const response = await page.goto("/");
	expect(response).not.toBeNull();
	expect(response?.status()).toBeLessThan(500);
	await expect(page.locator("body")).toBeVisible();
});

test.describe("Admin Home Interactions", () => {
	test("navigating to root redirects to dashboard or login", async ({
		page,
	}) => {
		test.slow();
		await page.goto("/");
		// Admin app root natively redirects to /dashboard via Next.js router.
		// If unauthenticated, the middleware routes it to /login.
		await expect(page).toHaveURL(/\/(dashboard|login)/);
	});
});
