import { afterAll, afterEach, beforeAll } from "@jest/globals";
import { config as loadEnv } from "dotenv";
import {
	assertSafeTestEnvironment,
	createTestPrismaClient,
	resetPublicSchema,
} from "./database";

loadEnv({ path: ".env.test" });

const prisma = createTestPrismaClient();

beforeAll(() => {
	assertSafeTestEnvironment();
});

afterEach(async () => {
	await resetPublicSchema(prisma);
});

afterAll(async () => {
	await prisma.$disconnect();
});
