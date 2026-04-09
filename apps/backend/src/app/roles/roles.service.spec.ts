import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import type { RoleListResponse } from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import { RolesService } from "./roles.service";

describe("RolesService", () => {
	type RoleItems = RoleListResponse["roles"];
	const findManyMock = jest.fn<() => Promise<RoleItems>>();

	const mockDb = {
		role: {
			findMany: findManyMock,
		},
	};

	let service: RolesService;

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RolesService,
				{
					provide: DbService,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<RolesService>(RolesService);
	});

	it("returns roles from database sorted by name", async () => {
		const roles: RoleItems = [
			{
				id: "role-admin",
				name: "admin_staff",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			},
			{
				id: "role-it",
				name: "it_admin",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		];

		mockDb.role.findMany.mockResolvedValue(roles);

		const result = await service.getRoles();

		expect(mockDb.role.findMany).toHaveBeenCalledWith({
			orderBy: {
				name: "asc",
			},
		});
		expect(result).toEqual({ roles });
	});
});
