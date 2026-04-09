import { test } from "@playwright/test";

test.describe("Auth flow inventory (pending automation)", () => {
	test.fixme(
		"AUTH-3 password-reset link happy path updates password and redirects",
		"Requires controllable reset-link generation and isolated disposable account in CI.",
	);

	test.fixme(
		"AUTH-4 invite-link set-password happy path activates invited user",
		"Requires deterministic invitation email capture/link consumption in CI.",
	);

	test.fixme(
		"AUTH-5 session token refresh happens silently without workflow interruption",
		"Needs deterministic token-expiry simulation and runtime event assertion in browser session.",
	);

	test.fixme(
		"AUTH-9 confirm-password mismatch shows inline validation and blocks submit",
		"Needs deterministic set-password session bootstrap in E2E.",
	);

	test.fixme(
		"AUTH-15 weak password validation criteria and disabled submit",
		"Needs deterministic set-password session bootstrap in E2E.",
	);

	test.fixme(
		"AUTH-17 deactivated user using reset link is blocked and redirected to login",
		"Requires deactivated user recovery-link execution flow with controlled test data.",
	);
});
