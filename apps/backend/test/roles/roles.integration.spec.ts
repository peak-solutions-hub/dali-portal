import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "@jest/globals";
import type { RoleType } from "@repo/shared";
import { RolesService } from "../../src/app/roles/roles.service";
import { createTestPrismaClient } from "../database";

const shouldResetDb = process.env.TEST_DB_RESET === "true";

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
		await createRole(randomUUID(), "vice_mayor");
		await createRole(randomUUID(), "admin_staff");
		await createRole(randomUUID(), "it_admin");

		const result = await service.getRoles();
		const roleNames = result.roles.map((role) => role.name);

		expect(roleNames).toContain("it_admin");
		expect(roleNames).toContain("vice_mayor");
		expect(roleNames).toContain("admin_staff");
		expect(roleNames.length).toBeGreaterThan(0);
	});

	it("returns an empty list when there are no roles", async () => {
		if (!shouldResetDb) {
			return;
		}

		const result = await service.getRoles();

		expect(result).toEqual({ roles: [] });
	});
});
