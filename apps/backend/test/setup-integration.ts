import { afterAll, afterEach, beforeAll, beforeEach } from "@jest/globals";
import {
	assertSafeTestEnvironment,
	cleanupUsersAndRolesFromSnapshot,
	createTestPrismaClient,
	createUserRoleCleanupSnapshot,
	type UserRoleCleanupSnapshot,
} from "./database";
import { loadTestEnv } from "./load-test-env";

loadTestEnv();

const prisma = createTestPrismaClient();
let snapshot: UserRoleCleanupSnapshot | null = null;

beforeAll(() => {
	assertSafeTestEnvironment();
});

afterEach(async () => {
	if (!snapshot) {
		return;
	}

	await cleanupUsersAndRolesFromSnapshot(prisma, snapshot);
	snapshot = null;
});

beforeEach(async () => {
	snapshot = await createUserRoleCleanupSnapshot(prisma);
});

afterAll(async () => {
	await prisma.$disconnect();
});
