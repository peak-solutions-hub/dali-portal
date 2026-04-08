import { expect, test } from "@playwright/test";
import {
	getAccessTokenForCredentials,
	getRequiredEnv,
	skipIfMissingDeactivatedCredentials,
	skipIfMissingItAdminCredentials,
} from "./helpers/auth-session.js";

function getApiBaseUrl(): string {
	return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080";
}

function getItAdminToken(): Promise<string> {
	return getAccessTokenForCredentials(
		getRequiredEnv("E2E_IT_ADMIN_EMAIL") as string,
		getRequiredEnv("E2E_IT_ADMIN_PASSWORD") as string,
	);
}

test.describe("User Management API flows (E2E)", () => {
	test.beforeEach(() => {
		skipIfMissingItAdminCredentials();
	});

	test("UM-5 invite valid user, UM-9 reinvite invited user", async ({
		request,
	}) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const listRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(listRes.ok()).toBe(true);
		const listBody = (await listRes.json()) as {
			users?: Array<{ roleId: string; role?: { name?: string } }>;
		};
		const roleId =
			listBody.users?.find((u) => u.role?.name !== "it_admin")?.roleId ??
			listBody.users?.[0]?.roleId;
		expect(roleId).toBeTruthy();

		const email = `um-invite-${Date.now()}@example.com`;
		const inviteRes = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Invite Api User",
				email,
				roleId,
			},
		});
		expect(inviteRes.ok()).toBe(true);
		const inviteBody = (await inviteRes.json()) as {
			success?: boolean;
			message?: string;
		};
		expect(inviteBody.success).toBe(true);
		expect(inviteBody.message ?? "").toContain("Invitation");

		const reinviteRes = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Invite Api User Updated",
				email,
				roleId,
			},
		});
		expect(reinviteRes.ok()).toBe(true);
		const reinviteBody = (await reinviteRes.json()) as {
			success?: boolean;
			message?: string;
		};
		expect(reinviteBody.success).toBe(true);
		expect(reinviteBody.message ?? "").toContain("Reinvitation");
	});

	test("UM-16 invite with active email returns conflict", async ({
		request,
	}) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const listRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(listRes.ok()).toBe(true);
		const listBody = (await listRes.json()) as {
			users?: Array<{ roleId: string; role?: { name?: string } }>;
		};
		const roleId =
			listBody.users?.find((u) => u.role?.name !== "it_admin")?.roleId ??
			listBody.users?.[0]?.roleId;
		expect(roleId).toBeTruthy();

		const response = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Already Active",
				email: getRequiredEnv("E2E_IT_ADMIN_EMAIL"),
				roleId,
			},
		});

		expect(response.status()).toBe(409);
		const bodyText = JSON.stringify(await response.json().catch(() => null));
		expect(bodyText).toContain("active");
	});

	test("UM-18 IT admin cannot demote self", async ({ request }) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const meRes = await request.get(`${apiBase}/users/me`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(meRes.ok()).toBe(true);
		const me = (await meRes.json()) as { id: string };

		const usersRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(usersRes.ok()).toBe(true);
		const usersBody = (await usersRes.json()) as {
			users?: Array<{ roleId: string; role?: { name?: string } }>;
		};
		const nonItRoleId = usersBody.users?.find(
			(user) => user.role?.name !== "it_admin",
		)?.roleId;
		expect(nonItRoleId).toBeTruthy();

		const updateRes = await request.patch(`${apiBase}/users/${me.id}`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				id: me.id,
				roleId: nonItRoleId,
			},
		});

		expect(updateRes.status()).toBe(403);
		const bodyText = JSON.stringify(await updateRes.json().catch(() => null));
		expect(bodyText).toContain("SELF_DEMOTION");
	});

	test("UM-26 activate already-active user returns bad request", async ({
		request,
	}) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const meRes = await request.get(`${apiBase}/users/me`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(meRes.ok()).toBe(true);
		const me = (await meRes.json()) as { id: string };

		const activateRes = await request.patch(
			`${apiBase}/users/activate/${me.id}`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
				data: { id: me.id },
			},
		);

		expect(activateRes.status()).toBe(400);
		const bodyText = JSON.stringify(await activateRes.json().catch(() => null));
		expect(bodyText).toContain("ALREADY_ACTIVE");
	});

	test("UM-28 update missing user returns not found", async ({ request }) => {
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const missingId = "00000000-0000-0000-0000-000000000999";
		const response = await request.patch(`${apiBase}/users/${missingId}`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				id: missingId,
				fullName: "Missing User",
			},
		});

		expect(response.status()).toBe(404);
		const bodyText = JSON.stringify(await response.json().catch(() => null));
		expect(bodyText).toContain("NOT_FOUND");
	});

	test("UM-17 invite deactivated email suggests reactivation", async ({
		request,
	}) => {
		skipIfMissingDeactivatedCredentials();
		const apiBase = getApiBaseUrl();
		const accessToken = await getItAdminToken();

		const listRes = await request.get(`${apiBase}/users`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		expect(listRes.ok()).toBe(true);
		const listBody = (await listRes.json()) as {
			users?: Array<{ roleId: string; role?: { name?: string } }>;
		};
		const roleId =
			listBody.users?.find((u) => u.role?.name !== "it_admin")?.roleId ??
			listBody.users?.[0]?.roleId;
		expect(roleId).toBeTruthy();

		const response = await request.post(`${apiBase}/users/invite`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			data: {
				fullName: "Deactivated Existing",
				email: getRequiredEnv("E2E_DEACTIVATED_EMAIL"),
				roleId,
			},
		});

		expect(response.status()).toBe(400);
		const bodyText = JSON.stringify(await response.json().catch(() => null));
		expect(bodyText).toContain("DEACTIVATED_SUGGEST_REACTIVATION");
	});
});
