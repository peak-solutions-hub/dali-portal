import { expect, test } from "@playwright/test";
import {
	signInAsNonAdmin,
	skipIfMissingNonAdminCredentials,
} from "../helpers/auth-session.js";

test.describe("User Management - access control", () => {
	test("UM-25 unauthenticated access redirects to login with redirect path", async ({
		page,
	}) => {
		await page.goto("/user-management");
		await expect(page).toHaveURL(/\/login/);
		await expect(page).toHaveURL(/redirect=%2Fuser-management/);
	});

	test("UM-24 non-IT-admin cannot stay on user-management route", async ({
		page,
		context,
	}) => {
		skipIfMissingNonAdminCredentials();
		await signInAsNonAdmin(context);

		await page.goto("/user-management");

		await expect(page).not.toHaveURL(/\/user-management$/);
		await expect(page).toHaveURL(/\/(login|unauthorized|dashboard)/);
	});
});
