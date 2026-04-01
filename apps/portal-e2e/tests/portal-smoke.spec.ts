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

test.describe("Portal Home Interactions", () => {
	test("search bar redirects to legislative documents with query", async ({
		page,
	}) => {
		test.slow();
		await page.goto("/");

		const searchInput = page.getByPlaceholder(
			"Search for an ordinance or resolution",
		);
		await searchInput.fill("zoning");

		const searchButton = page.getByRole("button", { name: "Search" });
		await searchButton.click();

		await expect(page).toHaveURL(/\/legislative-documents\?search=zoning/);
	});

	test("quick actions navigate to correct inquiry tabs", async ({ page }) => {
		test.slow();
		await page.goto("/");

		const makeInquiryLink = page
			.getByRole("main")
			.getByRole("link", { name: "Make an Inquiry" });
		await makeInquiryLink.click();
		await expect(page).toHaveURL(/\/inquiries\?tab=submit/);

		await page.goto("/");
		const trackInquiryLink = page
			.getByRole("main")
			.getByRole("link", { name: "Track an Inquiry" });
		await trackInquiryLink.click();
		await expect(page).toHaveURL(/\/inquiries\?tab=track/);
	});
});
