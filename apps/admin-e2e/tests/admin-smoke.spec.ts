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
