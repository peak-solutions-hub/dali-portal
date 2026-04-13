import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	jest,
} from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app/app.module";
import { RolesGuard } from "../src/app/auth/guards/roles.guard";
import { SupabaseAdminService } from "../src/app/util/supabase/supabase-admin.service";
import {
	assertSafeTestEnvironment,
	cleanupUsersAndRolesFromSnapshot,
	createTestPrismaClient,
	createUserRoleCleanupSnapshot,
	type UserRoleCleanupSnapshot,
} from "./database";
import { loadTestEnv } from "./load-test-env";

loadTestEnv();

const supabaseClientMock = {
	auth: {
		admin: {
			inviteUserByEmail: jest.fn(),
			deleteUser: jest.fn(),
		},
		resetPasswordForEmail: jest.fn(),
	},
};

const supabaseAdminServiceMock = {
	getClient: jest.fn(() => supabaseClientMock),
};

const prisma = createTestPrismaClient();
let app: INestApplication;
let snapshot: UserRoleCleanupSnapshot | null = null;

beforeAll(async () => {
	assertSafeTestEnvironment();

	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	})
		.overrideProvider(SupabaseAdminService)
		.useValue(supabaseAdminServiceMock)
		.compile();

	app = moduleRef.createNestApplication();
	await app.init();
});

beforeEach(async () => {
	snapshot = await createUserRoleCleanupSnapshot(prisma);
});

afterEach(async () => {
	RolesGuard.clearCache();
	jest.clearAllMocks();

	if (!snapshot) {
		return;
	}

	await cleanupUsersAndRolesFromSnapshot(prisma, snapshot);
	snapshot = null;
});

afterAll(async () => {
	await app.close();
	await prisma.$disconnect();
});

export function getHttpServer() {
	return app.getHttpServer();
}

export { prisma, supabaseClientMock };
