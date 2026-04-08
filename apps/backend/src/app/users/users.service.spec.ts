import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { Test, type TestingModule } from "@nestjs/testing";
import { RolesGuard } from "@/app/auth/guards/roles.guard";
import { DbService } from "@/app/db/db.service";
import { SupabaseAdminService } from "@/app/util/supabase/supabase-admin.service";
import { ConfigService } from "@/lib/config.service";
import { UsersService } from "./users.service";

describe("UsersService", () => {
	type MockFn = ReturnType<typeof jest.fn>;
	type MockUser = {
		id: string;
		email: string;
		fullName: string;
		status: "invited" | "active" | "deactivated";
		roleId: string;
		role: {
			id?: string;
			name: string;
		};
	};

	const mockDb = {
		user: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		},
		role: {
			findUnique: jest.fn(),
		},
	} as {
		user: {
			findMany: MockFn;
			findUnique: MockFn;
			findFirst: MockFn;
			create: MockFn;
			update: MockFn;
		};
		role: {
			findUnique: MockFn;
		};
	};

	const mockSupabaseClient = {
		auth: {
			admin: {
				inviteUserByEmail: jest.fn(),
				deleteUser: jest.fn(),
			},
			resetPasswordForEmail: jest.fn(),
		},
	} as {
		auth: {
			admin: {
				inviteUserByEmail: MockFn;
				deleteUser: MockFn;
			};
			resetPasswordForEmail: MockFn;
		};
	};

	const mockSupabaseAdmin = {
		getClient: jest.fn(() => mockSupabaseClient),
	};

	const mockConfigService = {
		getOrThrow: jest.fn(() => "http://127.0.0.1:3001"),
	};

	const makeUser = (overrides: Partial<MockUser> = {}): MockUser => ({
		id: "6d1d9e8f-5e91-4f89-b8fc-c7b84970e18a",
		email: "test.user@example.com",
		fullName: "Test User",
		status: "active" as const,
		roleId: "0f0828ec-ff80-4f4c-b66a-1778cd42e8d0",
		role: {
			id: "0f0828ec-ff80-4f4c-b66a-1778cd42e8d0",
			name: "it_admin",
		},
		...overrides,
	});

	let service: UsersService;
	let testingModule: TestingModule;
	let invalidateCacheSpy: ReturnType<typeof jest.spyOn>;

	beforeEach(async () => {
		jest.clearAllMocks();
		invalidateCacheSpy = jest
			.spyOn(RolesGuard, "invalidateUserCache")
			.mockImplementation(() => undefined);

		testingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: DbService,
					useValue: mockDb,
				},
				{
					provide: SupabaseAdminService,
					useValue: mockSupabaseAdmin,
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = testingModule.get<UsersService>(UsersService);
	});

	afterEach(async () => {
		invalidateCacheSpy.mockRestore();
		await testingModule.close();
	});

	describe("getUsers", () => {
		it("sorts users by status priority then role priority", async () => {
			mockDb.user.findMany.mockResolvedValue([
				makeUser({
					id: "1",
					status: "deactivated",
					role: { name: "admin_staff" },
				}),
				makeUser({ id: "2", status: "active", role: { name: "ovm_staff" } }),
				makeUser({ id: "3", status: "invited", role: { name: "admin_staff" } }),
				makeUser({ id: "4", status: "active", role: { name: "it_admin" } }),
			]);

			const result: Awaited<ReturnType<UsersService["getUsers"]>> =
				await service.getUsers({});

			expect(result.users.map((u: { id: string }) => u.id)).toEqual([
				"3",
				"4",
				"2",
				"1",
			]);
			expect(mockDb.user.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					include: { role: true },
				}),
			);
		});
	});

	describe("updateUser", () => {
		it("updates user details and invalidates cache", async () => {
			const existing = makeUser();
			const updated = makeUser({ fullName: "Updated User" });

			mockDb.user.findUnique.mockResolvedValue(existing);
			mockDb.role.findUnique.mockResolvedValue(existing.role);
			mockDb.user.update.mockResolvedValue(updated);

			const result = await service.updateUser(
				{
					id: existing.id,
					fullName: "Updated User",
					roleId: existing.roleId,
				},
				existing.id,
			);

			expect(result.fullName).toBe("Updated User");
			expect(invalidateCacheSpy).toHaveBeenCalledWith(existing.id);
		});

		it("throws USER.SELF_DEMOTION when IT admin demotes self", async () => {
			const existing = makeUser({ role: { name: "it_admin" } });

			mockDb.user.findUnique.mockResolvedValue(existing);
			mockDb.role.findUnique.mockResolvedValue({
				id: "role-2",
				name: "admin_staff",
			});

			await expect(
				service.updateUser({ id: existing.id, roleId: "role-2" }, existing.id),
			).rejects.toMatchObject({ code: "USER.SELF_DEMOTION" });
		});

		it("throws USER.NOT_FOUND when updating non-existent user", async () => {
			mockDb.user.findUnique.mockResolvedValue(null);

			await expect(
				service.updateUser({
					id: "missing-id",
					fullName: "Name",
				}),
			).rejects.toMatchObject({ code: "USER.NOT_FOUND" });
		});

		it("throws USER.INVALID_ROLE for unknown role", async () => {
			const existing = makeUser();
			mockDb.user.findUnique.mockResolvedValue(existing);
			mockDb.role.findUnique.mockResolvedValue(null);

			await expect(
				service.updateUser({ id: existing.id, roleId: "missing-role" }),
			).rejects.toMatchObject({ code: "USER.INVALID_ROLE" });
		});
	});

	describe("deactivateUser", () => {
		it("deactivates an active user and invalidates cache", async () => {
			const existing = makeUser({ status: "active" });
			const deactivated = makeUser({ status: "deactivated" });

			mockDb.user.findUnique.mockResolvedValue(existing);
			mockDb.user.update.mockResolvedValue(deactivated);

			const result = await service.deactivateUser(existing.id);

			expect(result.status).toBe("deactivated");
			expect(invalidateCacheSpy).toHaveBeenCalledWith(existing.id);
		});

		it("returns existing user without update when already deactivated", async () => {
			const existing = makeUser({ status: "deactivated" });
			mockDb.user.findUnique.mockResolvedValue(existing);

			const result = await service.deactivateUser(existing.id);

			expect(result.status).toBe("deactivated");
			expect(mockDb.user.update).not.toHaveBeenCalled();
		});
	});

	describe("activateUser", () => {
		it("activates invited user and invalidates cache", async () => {
			const invited = makeUser({ status: "invited" });
			const activated = makeUser({ status: "active" });

			mockDb.user.findUnique.mockResolvedValue(invited);
			mockDb.user.update.mockResolvedValue(activated);

			const result = await service.activateUser({ id: invited.id });

			expect(result.status).toBe("active");
			expect(invalidateCacheSpy).toHaveBeenCalledWith(invited.id);
		});

		it("throws USER.ALREADY_ACTIVE when user is already active", async () => {
			const active = makeUser({ status: "active" });
			mockDb.user.findUnique.mockResolvedValue(active);

			await expect(
				service.activateUser({ id: active.id }),
			).rejects.toMatchObject({
				code: "USER.ALREADY_ACTIVE",
			});
		});
	});

	describe("checkEmailStatus", () => {
		it("returns exists=false when email is not found", async () => {
			mockDb.user.findFirst.mockResolvedValue(null);

			const result = await service.checkEmailStatus({
				email: "missing@example.com",
			});

			expect(result).toEqual({ exists: false, isDeactivated: false });
		});

		it("returns deactivated state when user is deactivated", async () => {
			mockDb.user.findFirst.mockResolvedValue(
				makeUser({ status: "deactivated" }),
			);

			const result = await service.checkEmailStatus({
				email: "user@example.com",
			});

			expect(result).toEqual({ exists: true, isDeactivated: true });
		});
	});

	describe("inviteUser", () => {
		const baseInput = {
			email: "invitee@example.com",
			fullName: "Invitee User",
			roleId: "0f0828ec-ff80-4f4c-b66a-1778cd42e8d0",
		};

		it("creates and invites a fresh user", async () => {
			mockDb.role.findUnique.mockResolvedValue({
				id: baseInput.roleId,
				name: "admin_staff",
			});
			mockDb.user.findFirst.mockResolvedValue(null);
			mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
				data: { user: { id: "1f9ea00f-cfa1-4f45-85f9-597ca7b611f7" } },
				error: null,
			});
			mockDb.user.create.mockResolvedValue(
				makeUser({ id: "1f9ea00f-cfa1-4f45-85f9-597ca7b611f7" }),
			);

			const result = await service.inviteUser(baseInput);

			expect(result.success).toBe(true);
			expect(result.message).toContain("Invitation email sent successfully");
			expect(mockDb.user.create).toHaveBeenCalled();
		});

		it("throws USER.EMAIL_ALREADY_EXISTS when email belongs to active user", async () => {
			mockDb.role.findUnique.mockResolvedValue({
				id: baseInput.roleId,
				name: "admin_staff",
			});
			mockDb.user.findFirst.mockResolvedValue(makeUser({ status: "active" }));

			await expect(service.inviteUser(baseInput)).rejects.toMatchObject({
				code: "USER.EMAIL_ALREADY_EXISTS",
			});
		});

		it("throws USER.DEACTIVATED_SUGGEST_REACTIVATION when email belongs to deactivated user", async () => {
			mockDb.role.findUnique.mockResolvedValue({
				id: baseInput.roleId,
				name: "admin_staff",
			});
			mockDb.user.findFirst.mockResolvedValue(
				makeUser({ status: "deactivated" }),
			);

			await expect(service.inviteUser(baseInput)).rejects.toMatchObject({
				code: "USER.DEACTIVATED_SUGGEST_REACTIVATION",
			});
		});

		it("reinvites invited user by deleting old auth user and updating DB", async () => {
			const invitedUser = makeUser({
				status: "invited",
				id: "e5f50f4f-e5a5-486a-b450-f09b32611aeb",
			});

			mockDb.role.findUnique.mockResolvedValue({
				id: baseInput.roleId,
				name: "admin_staff",
			});
			mockDb.user.findFirst.mockResolvedValue(invitedUser);
			mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
				data: {},
				error: null,
			});
			mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
				data: { user: { id: "a18de9e1-7248-4f15-9115-cf4a9fd225a5" } },
				error: null,
			});
			mockDb.user.update.mockResolvedValue(
				makeUser({
					id: "a18de9e1-7248-4f15-9115-cf4a9fd225a5",
					status: "invited",
				}),
			);

			const result = await service.inviteUser(baseInput);

			expect(result.success).toBe(true);
			expect(result.message).toContain("Reinvitation email sent successfully");
			expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith(
				invitedUser.id,
			);
			expect(mockDb.user.update).toHaveBeenCalled();
		});

		it("throws USER.DB_CREATE_FAILED and deletes auth user when DB create fails", async () => {
			mockDb.role.findUnique.mockResolvedValue({
				id: baseInput.roleId,
				name: "admin_staff",
			});
			mockDb.user.findFirst.mockResolvedValue(null);
			mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
				data: { user: { id: "b6f78d8a-e37e-48d7-8f5f-f8bdb78fc4db" } },
				error: null,
			});
			mockDb.user.create.mockRejectedValue(new Error("db fail"));

			await expect(service.inviteUser(baseInput)).rejects.toMatchObject({
				code: "USER.DB_CREATE_FAILED",
			});
			expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith(
				"b6f78d8a-e37e-48d7-8f5f-f8bdb78fc4db",
			);
		});
	});

	describe("requestPasswordReset", () => {
		it("returns success for non-existent users to prevent enumeration", async () => {
			mockDb.user.findFirst.mockResolvedValue(null);

			const result = await service.requestPasswordReset({
				email: "unknown@example.com",
			});

			expect(result).toEqual({ success: true });
			expect(
				mockSupabaseClient.auth.resetPasswordForEmail,
			).not.toHaveBeenCalled();
		});

		it("throws deactivated account error for deactivated users", async () => {
			mockDb.user.findFirst.mockResolvedValue({ status: "deactivated" });

			await expect(
				service.requestPasswordReset({ email: "deactivated@example.com" }),
			).rejects.toMatchObject({ code: "AUTH.DEACTIVATED_ACCOUNT" });
		});

		it("calls supabase reset password for existing active users", async () => {
			mockDb.user.findFirst.mockResolvedValue({ status: "active" });
			mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
				data: {},
				error: null,
			});

			const result = await service.requestPasswordReset({
				email: "active@example.com",
			});

			expect(result).toEqual({ success: true });
			expect(
				mockSupabaseClient.auth.resetPasswordForEmail,
			).toHaveBeenCalledWith(
				"active@example.com",
				expect.objectContaining({ redirectTo: expect.any(String) }),
			);
		});
	});
});
