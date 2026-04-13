import { expect, test } from "@playwright/test";

const STEP_DELAY_MS = 350;

test.describe("Inquiries Page", () => {
	test("loads the page and shows the new inquiry tab by default", async ({
		page,
	}) => {
		await page.goto("/inquiries");
		await page.waitForTimeout(STEP_DELAY_MS);

		await expect(
			page.getByRole("heading", { name: "Citizen Inquiry Help Desk" }),
		).toBeVisible();
		await expect(
			page.getByRole("tab", { name: "New Inquiry" }),
		).toHaveAttribute("aria-selected", "true");
		await expect(page.getByText("Personal Details")).toBeVisible();
		await page.locator('input[name="citizenFirstName"]').fill("pogi");
		await page.locator('input[name="citizenLastName"]').fill("Ako");
		await page
			.locator('input[name="citizenEmail"]')
			.fill("matthewwwtorrechilla@gmail.com");
		await page
			.locator('input[name="citizenContactNumber"]')
			.fill("09171234567");
		await page.locator('input[name="citizenAddress"]').fill("Iloilo");
		await page.getByRole("combobox", { name: "Category *" }).click();
		await page.getByRole("option", { name: "Request For Assistance" }).click();
		await page.locator('input[name="subject"]').fill("Medical Assistance");
		await page
			.getByPlaceholder(
				"Please describe your inquiry, concern, or request in detail...",
			)
			.fill("Hello, i need money");
		await page.locator('input[type="file"]').setInputFiles("tests/peak.png");
		await expect(page.getByText("peak.png")).toBeVisible();
		await page.getByRole("button", { name: "Submit Inquiry" }).click();
	});

	test("new inquiry shows required validation messages on empty submit", async ({
		page,
	}) => {
		await page.goto("/inquiries");
		await page.waitForTimeout(STEP_DELAY_MS);

		await page.getByRole("button", { name: "Submit Inquiry" }).click();

		await expect(page.getByText("First name is required.")).toBeVisible();
		await expect(page.getByText("Last name is required.")).toBeVisible();
		await expect(page.getByText("Contact number is required.")).toBeVisible();
		await expect(page.getByText("Address is required.")).toBeVisible();
		await expect(page.getByText("Subject is required.")).toBeVisible();
		await expect(page.getByText("Message is required.")).toBeVisible();
	});

	test("new inquiry blocks invalid contact number", async ({ page }) => {
		await page.goto("/inquiries");
		await page.waitForTimeout(STEP_DELAY_MS);

		await page.locator('input[name="citizenFirstName"]').fill("Test");
		await page.locator('input[name="citizenLastName"]').fill("Citizen");
		await page.locator('input[name="citizenContactNumber"]').fill("12345");
		await page.locator('input[name="citizenAddress"]').fill("Iloilo City");
		await page.locator('input[name="subject"]').fill("Need Assistance");
		await page
			.getByPlaceholder(
				"Please describe your inquiry, concern, or request in detail...",
			)
			.fill("Testing invalid contact validation");

		await page.getByRole("button", { name: "Submit Inquiry" }).click();

		await expect(
			page.getByText(
				"Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).",
			),
		).toBeVisible();
	});

	test("track tab shows required controls", async ({ page }) => {
		await page.goto("/inquiries?tab=track");
		await page.waitForTimeout(STEP_DELAY_MS);

		await expect(
			page.getByRole("heading", { name: "Citizen Inquiry Help Desk" }),
		).toBeVisible();
		await expect(page.getByPlaceholder("IC26-ABCD1234")).toBeVisible();
		await expect(page.getByPlaceholder("09171234567")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Track Ticket" }),
		).toBeVisible();
	});

	test("track tab shows required validation messages on empty submit", async ({
		page,
	}) => {
		await page.goto("/inquiries?tab=track");
		await page.waitForTimeout(STEP_DELAY_MS);

		await page.getByRole("button", { name: "Track Ticket" }).click();

		await expect(page.getByText("Reference number is required.")).toBeVisible();
		await expect(page.getByText("Contact number is required.")).toBeVisible();
	});

	test("track tab shows not found message for unknown inquiry", async ({
		page,
	}) => {
		await page.goto("/inquiries?tab=track");
		await page.waitForTimeout(STEP_DELAY_MS);

		await page.getByPlaceholder("IC26-ABCD1234").fill("IC26-UNKNOWN");
		await page.waitForTimeout(STEP_DELAY_MS);
		await page.getByPlaceholder("09171234567").fill("09171234567");
		await page.waitForTimeout(STEP_DELAY_MS);
		await page.getByRole("button", { name: "Track Ticket" }).click();

		await expect(page.getByText("Failed to fetch")).toBeVisible();
		await expect(page).toHaveURL(/\/inquiries\?tab=track/);
	});

	test("track tab blocks invalid contact number on submit", async ({
		page,
	}) => {
		await page.goto("/inquiries?tab=track");
		await page.waitForTimeout(STEP_DELAY_MS);

		await page.getByPlaceholder("IC26-ABCD1234").fill("IC26-ABCD1234");
		await page.waitForTimeout(STEP_DELAY_MS);
		await page.getByPlaceholder("09171234567").fill("12345");
		await page.waitForTimeout(STEP_DELAY_MS);
		await page.getByRole("button", { name: "Track Ticket" }).click();
		await page.waitForTimeout(STEP_DELAY_MS);

		await expect(
			page.getByText(
				"Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).",
			),
		).toBeVisible();
		await expect(page).toHaveURL(/\/inquiries\?tab=track/);
	});

	test("new inquiry rejects unsupported file type", async ({ page }) => {
		await page.goto("/inquiries");
		await page.waitForTimeout(STEP_DELAY_MS);

		await page
			.getByLabel("Upload supporting documents")
			.setInputFiles("tests/invalid-upload.txt");

		await expect(page.getByText("invalid-upload.txt")).toBeVisible();
		await expect(
			page.getByText(/This file type is not allowed/i).first(),
		).toBeVisible();
	});
});
