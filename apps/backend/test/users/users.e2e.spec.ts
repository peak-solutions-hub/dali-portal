import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import type { RoleType } from "@repo/shared";
import request from "supertest";
import { createAuthToken } from "../auth-token";
import { getHttpServer, prisma, supabaseClientMock } from "../setup-e2e";

describe("Users endpoints e2e", () => {
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
			include: {
				role: true,
			},
		});
	}

	it("blocks unauthenticated access to GET /users", async () => {
		const response = await request(getHttpServer()).get("/users");

		expect(response.status).toBe(401);
	});

	it("blocks non-IT admin access to GET /users", async () => {
		const adminRole = await createRole(randomUUID(), "admin_staff");
		const user = await createUser({
			id: randomUUID(),
			email: "admin.staff@example.com",
			fullName: "Admin Staff",
			status: "active",
			roleId: adminRole.id,
		});

		const token = createAuthToken(user.id);
		const response = await request(getHttpServer())
			.get("/users")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(403);
	});

	it("allows IT admin to list users", async () => {
		const itRole = await createRole(randomUUID(), "it_admin");
		const staffRole = await createRole(randomUUID(), "admin_staff");
		const itAdmin = await createUser({
			id: randomUUID(),
			email: "it.admin@example.com",
			fullName: "IT Admin User",
			status: "active",
			roleId: itRole.id,
		});
		const createdStaffId = randomUUID();
		await createUser({
			id: createdStaffId,
			email: "staff.member@example.com",
			fullName: "Staff Member",
			status: "active",
			roleId: staffRole.id,
		});

		const token = createAuthToken(itAdmin.id);
		const response = await request(getHttpServer())
			.get("/users")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("users");
		expect(Array.isArray(response.body.users)).toBe(true);
		expect(response.body.users.length).toBeGreaterThan(0);
		expect(
			response.body.users.some(
				(user: { id: string }) => user.id === itAdmin.id,
			),
		).toBe(true);
		expect(
			response.body.users.some(
				(user: { id: string }) => user.id === createdStaffId,
			),
		).toBe(true);
	});

	it("returns a specific user for IT admin via GET /users/{id}", async () => {
		const itRole = await createRole(randomUUID(), "it_admin");
		const staffRole = await createRole(randomUUID(), "admin_staff");
		const itAdmin = await createUser({
			id: randomUUID(),
			email: "get.by.id.admin@example.com",
			fullName: "Get By Id Admin",
			status: "active",
			roleId: itRole.id,
		});
		const staff = await createUser({
			id: randomUUID(),
			email: "target.staff@example.com",
			fullName: "Target Staff",
			status: "active",
			roleId: staffRole.id,
		});

		const token = createAuthToken(itAdmin.id);
		const response = await request(getHttpServer())
			.get(`/users/${staff.id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			id: staff.id,
			email: "target.staff@example.com",
			fullName: "Target Staff",
			status: "active",
			role: { name: "admin_staff" },
		});
	});

	it("returns 404 for IT admin when requested user does not exist", async () => {
		const itRole = await createRole(randomUUID(), "it_admin");
		const itAdmin = await createUser({
			id: randomUUID(),
			email: "not.found.admin@example.com",
			fullName: "Not Found Admin",
			status: "active",
			roleId: itRole.id,
		});

		const token = createAuthToken(itAdmin.id);
		const response = await request(getHttpServer())
			.get("/users/71000000-0000-4000-8000-999999999999")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(404);
	});

	it("prevents IT admin self-demotion on PATCH /users/{id}", async () => {
		const itRole = await createRole(randomUUID(), "it_admin");
		const staffRole = await createRole(randomUUID(), "admin_staff");
		const itAdmin = await createUser({
			id: randomUUID(),
			email: "self.demote@example.com",
			fullName: "Self Demote Admin",
			status: "active",
			roleId: itRole.id,
		});

		const token = createAuthToken(itAdmin.id);
		const response = await request(getHttpServer())
			.patch(`/users/${itAdmin.id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ roleId: staffRole.id });

		expect(response.status).toBe(403);
	});

	it("invites user through POST /users/invite and persists invited user", async () => {
		const itRole = await createRole(randomUUID(), "it_admin");
		const inviteRole = await createRole(randomUUID(), "admin_staff");
		const itAdmin = await createUser({
			id: randomUUID(),
			email: "invite.admin@example.com",
			fullName: "Invite Admin",
			status: "active",
			roleId: itRole.id,
		});

		const invitedUserId = randomUUID();
		supabaseClientMock.auth.admin.inviteUserByEmail.mockResolvedValue({
			data: {
				user: { id: invitedUserId },
			},
			error: null,
		} as never);

		const token = createAuthToken(itAdmin.id);
		const response = await request(getHttpServer())
			.post("/users/invite")
			.set("Authorization", `Bearer ${token}`)
			.send({
				email: "invited.user@example.com",
				fullName: "Invited Staff",
				roleId: inviteRole.id,
			});

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);

		const created = await prisma.user.findUnique({
			where: {
				id: invitedUserId,
			},
		});

		expect(created?.status).toBe("invited");
		expect(created?.email).toBe("invited.user@example.com");
	});

	it("returns email status for deactivated users without authentication", async () => {
		const role = await createRole(randomUUID(), "admin_staff");
		await createUser({
			id: randomUUID(),
			email: "deactivated.user@example.com",
			fullName: "Deactivated User",
			status: "deactivated",
			roleId: role.id,
		});

		const response = await request(getHttpServer())
			.post("/users/check-email-status")
			.send({
				email: "deactivated.user@example.com",
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			exists: true,
			isDeactivated: true,
		});
	});

	it("sends password reset request for existing active users", async () => {
		const role = await createRole(randomUUID(), "admin_staff");
		await createUser({
			id: randomUUID(),
			email: "active.user@example.com",
			fullName: "Active User",
			status: "active",
			roleId: role.id,
		});

		supabaseClientMock.auth.resetPasswordForEmail.mockResolvedValue({
			error: null,
		} as never);

		const response = await request(getHttpServer())
			.post("/users/request-password-reset")
			.send({
				email: "active.user@example.com",
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ success: true });
		expect(supabaseClientMock.auth.resetPasswordForEmail).toHaveBeenCalled();
	});
});
