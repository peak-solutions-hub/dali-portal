import { afterAll, afterEach, beforeAll } from "@jest/globals";
import { config as loadEnv } from "dotenv";
import {
	assertSafeTestEnvironment,
	createTestPrismaClient,
	resetPublicSchema,
} from "./database";

loadEnv({ path: ".env.test" });

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
