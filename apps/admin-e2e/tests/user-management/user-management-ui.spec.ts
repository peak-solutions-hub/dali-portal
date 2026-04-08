import { expect, type Page, test } from "@playwright/test";
import {
	signInAsItAdmin,
	skipIfMissingItAdminCredentials,
} from "./helpers/auth-session.js";

async function openUserManagement(page: Page) {
	await page.goto("/user-management");
	await expect(
		page.getByRole("heading", { name: "User Management" }),
	).toBeVisible();
	await expect(page.locator("tbody tr").first()).toBeVisible();
}

test.describe("User Management - UI behaviors", () => {
	test.beforeEach(async ({ context }) => {
		skipIfMissingItAdminCredentials();
		await signInAsItAdmin(context);
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

	test("UM-4 status filter narrows the table", async ({ page }) => {
		await openUserManagement(page);

		await page.getByRole("button", { name: /Filter/i }).click();
		await page.getByText("Invited").click();
		await page.getByRole("button", { name: "Apply Filters" }).click();

		const statuses = page.locator("tbody tr td:nth-child(3)");
		await expect(statuses.first()).toContainText(/Invited/i);
	});

	test("UM-3 role filter narrows the table to selected role", async ({
		page,
	}) => {
		await openUserManagement(page);

		await page.getByRole("button", { name: /Filter/i }).click();
		await page
			.getByText(/IT Admin|IT Admin/i)
			.first()
			.click();
		await page.getByRole("button", { name: "Apply Filters" }).click();

		const roles = page.locator("tbody tr td:nth-child(2)");
		await expect(roles.first()).toContainText(/IT Admin|it_admin/i);
	});

	test("UM-13 shows no users found for unmatched search", async ({ page }) => {
		await openUserManagement(page);

		await page
			.getByPlaceholder("Search by name or email...")
			.fill("no-user-should-match-this-search-term");

		await expect(page.getByText("No users found")).toBeVisible();
	});

	test("UM-14 combines search and status filter with AND logic", async ({
		page,
	}) => {
		await openUserManagement(page);

		await page.getByRole("button", { name: /Filter/i }).click();
		await page.getByText("Invited").click();
		await page.getByRole("button", { name: "Apply Filters" }).click();

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

	test("UM-10 paginates users client-side at 10 items per page when next page exists", async ({
		page,
	}) => {
		await openUserManagement(page);

		const nextButton = page.getByRole("button", { name: "Next" });
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

	test("UM-15 update dialog email field is read-only", async ({ page }) => {
		await openUserManagement(page);

		const firstRow = page.locator("tbody tr").first();
		await firstRow.getByRole("button").click();
		await page.getByRole("menuitem", { name: "Edit" }).click();

		const emailInput = page.locator("#email");
		await expect(emailInput).toBeDisabled();
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

	test("UM-20/UM-22/UM-23 invite form blocks invalid submission", async ({
		page,
	}) => {
		await openUserManagement(page);

		await page.getByRole("button", { name: "Invite New User" }).click();
		await page.locator("#fullName").fill("Abc");
		await page.locator("#email").fill("invalid-email");

		await expect(
			page.getByRole("button", { name: "Send Invitation" }),
		).toBeDisabled();
	});
});
