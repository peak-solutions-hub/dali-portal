import { expect, test } from "@playwright/test";
import { expectPageHealthy } from "@repo/playwright-utils";

test("portal home renders", async ({ page }) => {
	await expectPageHealthy(page, "/");
});

test("portal returns valid HTML structure", async ({ page }) => {
	const response = await page.goto("/");
	expect(response).not.toBeNull();
	expect(response?.status()).toBeLessThan(500);
	await expect(page.locator("body")).toBeVisible();
});
