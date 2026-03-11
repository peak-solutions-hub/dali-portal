import type { Locator, Page } from "@playwright/test";

/** Shorthand for `page.getByTestId(id)`. */
export function getByTestId(page: Page, id: string): Locator {
	return page.getByTestId(id);
}

/** Locate a navigation link by its accessible name. */
export function getNavLink(page: Page, name: string | RegExp): Locator {
	return page.getByRole("link", { name });
}

/** Locate a button by its accessible name. */
export function getButton(page: Page, name: string | RegExp): Locator {
	return page.getByRole("button", { name });
}

/** Locate a heading (any level) by its accessible name. */
export function getHeading(page: Page, name: string | RegExp): Locator {
	return page.getByRole("heading", { name });
}

/** Locate a form input by its label text. */
export function getFormField(page: Page, label: string | RegExp): Locator {
	return page.getByLabel(label);
}
