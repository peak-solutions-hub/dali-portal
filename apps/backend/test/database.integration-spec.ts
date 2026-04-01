import { createTestPrismaClient } from "./database";

describe("Database integration", () => {
	it("connects to the configured test database", async () => {
		const prisma = createTestPrismaClient();
		const result =
			await prisma.$queryRawUnsafe<{ value: number }[]>("SELECT 1 as value");

		expect(result[0]?.value).toBe(1);
		await prisma.$disconnect();
	});
});
