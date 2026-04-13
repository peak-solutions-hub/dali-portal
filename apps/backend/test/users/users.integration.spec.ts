import { randomUUID } from "node:crypto";
import {
	afterAll,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import type { RoleType } from "@repo/shared";
import { UsersService } from "../../src/app/users/users.service";
import { createTestPrismaClient } from "../database";

describe("UsersService integration", () => {
	type MockFn = ReturnType<typeof jest.fn>;
	type SupabaseMock = {
		auth: {
			admin: {
				inviteUserByEmail: MockFn;
				deleteUser: MockFn;
			};
			resetPasswordForEmail: MockFn;
		};
	};

	const prisma = createTestPrismaClient();

	const supabaseMock: SupabaseMock = {
		auth: {
			admin: {
				inviteUserByEmail: jest.fn(),
				deleteUser: jest.fn(),
			},
			resetPasswordForEmail: jest.fn(),
		},
	};

	const supabaseAdminServiceMock = {
		getClient: jest.fn(() => supabaseMock),
	};

	const configServiceMock = {
		getOrThrow: jest.fn(() => "http://127.0.0.1:3001"),
	};

	const service = new UsersService(
		prisma as never,
		supabaseAdminServiceMock as never,
		configServiceMock as never,
	);

	function createRole(name: RoleType) {
		return prisma.role.create({ data: { name } });
	}

	function createUser(input: {
		id: string;
		email: string;
		fullName: string;
		status: "invited" | "active" | "deactivated";
		roleId: string;
	}) {
		return prisma.user.create({ data: input, include: { role: true } });
	}

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it("returns users sorted by status then role priority", async () => {
		const roleAdmin = await createRole("admin_staff");
		const roleIt = await createRole("it_admin");
		const roleOvm = await createRole("ovm_staff");

		const deactivatedId = randomUUID();
		const activeOvmId = randomUUID();
		const invitedId = randomUUID();
		const activeItId = randomUUID();

		await createUser({
			id: deactivatedId,
			email: "deactivated@example.com",
			fullName: "Deactivated User",
			status: "deactivated",
			roleId: roleAdmin.id,
		});
		await createUser({
			id: activeOvmId,
			email: "active-ovm@example.com",
			fullName: "Active OVM",
			status: "active",
			roleId: roleOvm.id,
		});
		await createUser({
			id: invitedId,
			email: "invited@example.com",
			fullName: "Invited User",
			status: "invited",
			roleId: roleAdmin.id,
		});
		await createUser({
			id: activeItId,
			email: "active-it@example.com",
			fullName: "Active IT",
			status: "active",
			roleId: roleIt.id,
		});

		const result: Awaited<ReturnType<UsersService["getUsers"]>> =
			await service.getUsers({});
		const returnedIds = result.users.map((user: { id: string }) => user.id);
		const fixtureIds: string[] = [
			invitedId,
			activeItId,
			activeOvmId,
			deactivatedId,
		];

		for (const id of fixtureIds) {
			expect(returnedIds).toContain(id);
		}

		const fixtureUsers = result.users.filter((user: { id: string }) =>
			fixtureIds.includes(user.id),
		);
		expect(fixtureUsers.map((user: { id: string }) => user.id)).toEqual([
			invitedId,
			activeItId,
			activeOvmId,
			deactivatedId,
		]);
	});

	it("invites a user and creates an invited DB record", async () => {
		const role = await createRole("admin_staff");
		const invitedUserId = randomUUID();
		supabaseMock.auth.admin.inviteUserByEmail.mockResolvedValue({
			data: { user: { id: invitedUserId } },
			error: null,
		});

		const result = await service.inviteUser({
			email: "invite.integration@example.com",
			fullName: "Invite Integration",
			roleId: role.id,
		});

		const created = await prisma.user.findUnique({
			where: { id: invitedUserId },
		});

		expect(result.success).toBe(true);
		expect(created?.status).toBe("invited");
		expect(created?.email).toBe("invite.integration@example.com");
	});

	it("reinvites invited user by rotating auth id and keeping invited status", async () => {
		const role = await createRole("admin_staff");
		const oldUserId = randomUUID();
		const newUserId = randomUUID();
		const reinviteEmail = `reinvite.integration.${Date.now()}@example.com`;
		await createUser({
			id: oldUserId,
			email: reinviteEmail,
			fullName: "Reinvite Integration",
			status: "invited",
			roleId: role.id,
		});

		supabaseMock.auth.admin.deleteUser.mockResolvedValue({
			data: {},
			error: null,
		});
		supabaseMock.auth.admin.inviteUserByEmail.mockResolvedValue({
			data: { user: { id: newUserId } },
			error: null,
		});

		await service.inviteUser({
			email: reinviteEmail,
			fullName: "Reinvite Integration Updated",
			roleId: role.id,
		});

		const oldUser = await prisma.user.findUnique({
			where: { id: oldUserId },
		});
		const newUser = await prisma.user.findUnique({
			where: { id: newUserId },
		});

		expect(oldUser).toBeNull();
		expect(newUser?.status).toBe("invited");
		expect(supabaseMock.auth.admin.deleteUser).toHaveBeenCalledWith(oldUserId);
	});

	it("prevents IT admin self-demotion", async () => {
		const roleIt = await createRole("it_admin");
		const roleAdmin = await createRole("admin_staff");
		const user = await createUser({
			id: randomUUID(),
			email: "self.demote@example.com",
			fullName: "Self Demotion",
			status: "active",
			roleId: roleIt.id,
		});

		await expect(
			service.updateUser({ id: user.id, roleId: roleAdmin.id }, user.id),
		).rejects.toMatchObject({ code: "USER.SELF_DEMOTION" });
	});

	it("deactivates and reactivates a user", async () => {
		const role = await createRole("admin_staff");
		const user = await createUser({
			id: randomUUID(),
			email: "reactivate.integration@example.com",
			fullName: "Reactivation Candidate",
			status: "active",
			roleId: role.id,
		});

		const deactivated = await service.deactivateUser(user.id);
		expect(deactivated.status).toBe("deactivated");

		const activated = await service.activateUser({ id: user.id });
		expect(activated.status).toBe("active");
	});

	it("requestPasswordReset returns success for non-existent user", async () => {
		const result = await service.requestPasswordReset({
			email: "missing.reset@example.com",
		});

		expect(result).toEqual({ success: true });
		expect(supabaseMock.auth.resetPasswordForEmail).not.toHaveBeenCalled();
	});
});
