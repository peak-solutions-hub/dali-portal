import { test } from "@playwright/test";

test.describe("User Management flow inventory (pending automation)", () => {
	test.fixme(
		"UM-6 update user full name/role success path",
		"Requires stable disposable fixture user lifecycle for deterministic update assertions in E2E.",
	);

	test.fixme(
		"UM-7 deactivate active user success path",
		"Requires reversible fixture account and coordinated cleanup in CI.",
	);

	test.fixme(
		"UM-8 reactivate deactivated user success path",
		"Requires reversible fixture account and coordinated cleanup in CI.",
	);

	test.fixme(
		"UM-12 invite existing invited email performs re-invite through invite dialog path",
		"API-level behavior exists; dialog-path E2E still needs deterministic email/fixture orchestration.",
	);

	test.fixme(
		"UM-21 set-password with expired/invalid session link",
		"Auth-level scenario exists; UM-specific assertion path still needs deterministic session bootstrap.",
	);
});
