import { afterAll, afterEach, beforeAll } from "@jest/globals";
import {
	assertSafeTestEnvironment,
	createTestPrismaClient,
	resetPublicSchema,
} from "./database";
import { loadTestEnv } from "./load-test-env";

loadTestEnv();

const prisma = createTestPrismaClient();

beforeAll(async () => {
	assertSafeTestEnvironment();
	await resetPublicSchema(prisma);
});

afterEach(async () => {
	await resetPublicSchema(prisma);
});

afterAll(async () => {
	await prisma.$disconnect();
});
