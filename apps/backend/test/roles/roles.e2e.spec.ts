import { describe, expect, it } from "@jest/globals";
import type { RoleType } from "@repo/shared";
import request from "supertest";
import { createAuthToken } from "../auth-token";
import { getHttpServer, prisma } from "../setup-e2e";

describe("Roles endpoints e2e", () => {
	function createRole(id: string, name: RoleType) {
		return prisma.role.create({
			data: {
				id,
				name,
			},
		});
	}

	function createUser(input: {
		id: string;
		email: string;
		fullName: string;
		status: "invited" | "active" | "deactivated";
		roleId: string;
	}) {
		return prisma.user.create({
			data: input,
		});
	}

	it("blocks unauthenticated access to GET /roles", async () => {
		const response = await request(getHttpServer()).get("/roles");

		expect(response.status).toBe(401);
	});

	it("blocks non-IT admin access to GET /roles", async () => {
		const staffRole = await createRole(
			"72000000-0000-4000-8000-000000000001",
			"admin_staff",
		);
		const user = await createUser({
			id: "72000000-0000-4000-8000-000000000101",
			email: "staff.roles@example.com",
			fullName: "Staff Roles User",
			status: "active",
			roleId: staffRole.id,
		});

		const token = createAuthToken(user.id);
		const response = await request(getHttpServer())
			.get("/roles")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(403);
	});

	it("allows IT admin to list roles", async () => {
		const itRole = await createRole(
			"72000000-0000-4000-8000-000000000002",
			"it_admin",
		);
		await createRole("72000000-0000-4000-8000-000000000003", "ovm_staff");
		await createRole("72000000-0000-4000-8000-000000000004", "admin_staff");
		const itAdmin = await createUser({
			id: "72000000-0000-4000-8000-000000000102",
			email: "it.roles@example.com",
			fullName: "IT Roles Admin",
			status: "active",
			roleId: itRole.id,
		});

		const token = createAuthToken(itAdmin.id);
		const response = await request(getHttpServer())
			.get("/roles")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("roles");
		expect(Array.isArray(response.body.roles)).toBe(true);
		expect(
			response.body.roles.map((role: { name: string }) => role.name),
		).toEqual(["it_admin", "admin_staff", "ovm_staff"]);
	});
});
