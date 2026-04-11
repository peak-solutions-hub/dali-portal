import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import type { RoleType } from "@repo/shared";
import { JwtStrategy, type SupabaseJwtPayload } from "./jwt.strategy";

describe("JwtStrategy", () => {
	const findUniqueMock = jest.fn<() => Promise<unknown>>();

	const mockDb = {
		user: {
			findUnique: findUniqueMock,
		},
	};

	const mockConfigService = {
		getOrThrow: jest.fn(() => "test-jwt-secret"),
	};

	let strategy: JwtStrategy;

	beforeEach(() => {
		jest.clearAllMocks();
		JwtStrategy.clearCache();
		strategy = new JwtStrategy(mockConfigService as never, mockDb as never);
	});

	afterEach(() => {
		JwtStrategy.clearCache();
	});

	it("throws AUTH.INVALID_TOKEN when JWT subject is missing", async () => {
		await expect(
			strategy.validate({} as SupabaseJwtPayload),
		).rejects.toMatchObject({ code: "AUTH.INVALID_TOKEN" });
	});

	it("throws USER.NOT_FOUND when user record does not exist", async () => {
		findUniqueMock.mockResolvedValue(null);

		await expect(
			strategy.validate({ sub: "missing-user-id" }),
		).rejects.toMatchObject({ code: "USER.NOT_FOUND" });
	});

	it("throws DEACTIVATED_ACCOUNT when user status is deactivated", async () => {
		findUniqueMock.mockResolvedValue({
			id: "user-1",
			email: "deactivated@example.com",
			fullName: "Deactivated User",
			status: "deactivated",
			role: { name: "admin_staff" },
		});

		await expect(strategy.validate({ sub: "user-1" })).rejects.toMatchObject({
			code: "DEACTIVATED_ACCOUNT",
			status: 401,
		});
	});

	it("returns enriched user and reuses cached user data for repeated validation", async () => {
		findUniqueMock.mockResolvedValue({
			id: "user-2",
			email: "active@example.com",
			fullName: "Active User",
			status: "active",
			role: { name: "it_admin" as RoleType },
		});

		const first = await strategy.validate({
			sub: "user-2",
			app_metadata: { source: "first-call" },
		});
		const second = await strategy.validate({
			sub: "user-2",
			app_metadata: { source: "second-call" },
		});

		expect(first).toMatchObject({
			id: "user-2",
			email: "active@example.com",
			fullName: "Active User",
			role: "it_admin",
			status: "active",
			sub: "user-2",
		});
		expect(second).toMatchObject({
			id: "user-2",
			role: "it_admin",
			sub: "user-2",
		});
		expect(findUniqueMock).toHaveBeenCalledTimes(1);
	});
});
