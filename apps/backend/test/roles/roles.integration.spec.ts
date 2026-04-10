import { afterAll, describe, expect, it } from "@jest/globals";
import type { RoleType } from "@repo/shared";
import { RolesService } from "../../src/app/roles/roles.service";
import { createTestPrismaClient } from "../database";

describe("RolesService integration", () => {
	const prisma = createTestPrismaClient();
	const service = new RolesService(prisma as never);

	function createRole(id: string, name: RoleType) {
		return prisma.role.create({ data: { id, name } });
	}

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it("returns roles sorted by name", async () => {
		await createRole("70000000-0000-0000-0000-000000000001", "vice_mayor");
		await createRole("70000000-0000-0000-0000-000000000002", "admin_staff");
		await createRole("70000000-0000-0000-0000-000000000003", "it_admin");

		const result = await service.getRoles();

		expect(result.roles.map((role) => role.name)).toEqual([
			"it_admin",
			"vice_mayor",
			"admin_staff",
		]);
	});

	it("returns an empty list when there are no roles", async () => {
		const result = await service.getRoles();

		expect(result).toEqual({ roles: [] });
	});
});
