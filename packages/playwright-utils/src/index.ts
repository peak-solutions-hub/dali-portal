import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export * from "./auth.js";
export * from "./locators.js";
export * from "./session.js";
export * from "./ui/index.js";

export async function expectPageHealthy(page: Page, path = "/"): Promise<void> {
	const response = await page.goto(path);
	expect(response).not.toBeNull();
	expect(response?.status(), `Unexpected status for ${path}`).toBeLessThan(500);
	await expect(page.locator("body")).toBeVisible();
}
